import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CityService } from '../services/city.service';
import { OrderService } from '../services/order.service';
import { UtilsService } from '../services/utils.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  items: any[] = [];
  totalAmount = 0;
  private destroy$ = new Subject<void>();
  showConfirmButton = false;
  apiUrl = environment.apiUrl;
  userData: any = null;
  cityCharge = 0;
  paymentMethod: string = 'cash'; // default efectivo

  get isCartEmpty(): boolean {
    return this.items.length === 0;
  }

  getImageUrl(imageUrl: string): string {
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    return this.apiUrl + imageUrl;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private userService: UserService,
    private cityService: CityService,
    private orderService: OrderService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.items = this.cartService.getItems();
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);

    this.cartService.itemsChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedItems: any[]) => {
        this.items = updatedItems;
        this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
      });

    this.showConfirmButton = this.router.url === '/cart';
    this.loadUserData();

    // 👇 Detectar si venimos del retorno de Mercado Pago
    this.route.queryParams.subscribe(params => {
      if (params['status'] && params['external_reference']) {
        this.handleMercadoPagoReturn(params['status'], params['external_reference']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==========================
  // Manejo de retorno de MP
  // ==========================
  handleMercadoPagoReturn(status: string, orderNumber: string) {
    this.orderService.findByOrderNumber(orderNumber).subscribe({
      next: (res) => {
        const order = res.data;
        console.log('Estado de la orden:', order);
        if (order.status === 'pending') {
          this.utils.showAlert('success', 'Pago aprobado', '¡Gracias por tu compra!');
          this.cartService.clearCart();
          this.items = [];
          this.totalAmount = 0;
          this.productService.loadProducts();
          this.router.navigate(['/products']);
        } else if (order.status === 'awaiting_payment') {
          this.utils.showAlert('info', 'Pago pendiente', 'Estamos esperando la confirmación.');
        } else if (order.status === 'cancelled') {
          this.utils.showAlert('error', 'Pago rechazado', 'El pago no se pudo completar.');
        }
      },
      error: () => {
        this.utils.showAlert('error', 'Error', 'No pudimos verificar el estado del pago.');
      }
    });
  }

  // ==========================
  // Verificar stock item
  // ==========================
  verifyStock(item: any, operation: string) {
    const newQuantity = operation === 'compra' ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity < 1) {
      return this.removeItem(item);
    }
    this.productService.verifyStock(item.id, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        this.cartService.updateLocalStorage();
        this.cartService.notifyItemsChanged();
      },
      error: () => {
        this.utils.showAlert('error', 'Lo sentimos', `No hay stock suficiente para el producto ${item.name}`);
      }
    });
  }

  removeItem(item: any) {
    this.cartService.removeFromCart(item);
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
  }

  // ==========================
  // Confirmar compra
  // ==========================
  confirmPurchase() {
    if (this.isCartEmpty) {
      this.utils.showAlert('warning', 'Carrito vacío', 'Debes agregar productos al carrito para poder confirmar una compra.');
      return;
    }

    if (!this.userData) {
      this.utils.showAlert('error', 'Acción no permitida', 'Debes iniciar sesión para confirmar tu compra.');
      this.router.navigate(['UserRegistration/login']);
      return;
    }

    const street = this.userData.street || 'Calle no especificada';
    const streetNumber = this.userData.streetNumber || 'S/N';
    const fullAddress = `${street} ${streetNumber}`;

    this.utils.showConfirm(
      '¿Desea enviar la compra a su dirección registrada?',
      `Dirección registrada: ${fullAddress}`
    ).then((result) => {
      if (result.isConfirmed) {
        this.createOrder(this.items, this.paymentMethod);
      } else {
        this.utils.showAlert('info', 'Redirigiendo', 'Por favor, actualice su dirección.');
        setTimeout(() => {
          this.router.navigate(['UserInformation']);
        }, 2000);
      }
    });
  }

  createOrder(items: any[], paymentMethod: string) {
    let stockErrorProducts: string[] = [];
    const verifyStockPromises = items.map((item) =>
      this.productService.verifyStock(item.id, item.quantity).toPromise().catch(() => {
        stockErrorProducts.push(item.name);
      })
    );

    Promise.all(verifyStockPromises)
      .then(() => {
        if (stockErrorProducts.length > 0) {
          this.utils.showAlert('error', 'Stock insuficiente', `No hay suficiente stock para: ${stockErrorProducts.join(', ')}`);
          return;
        }

        const orderData = {
          userId: this.userData.id,
          orderItems: this.cartService.getItemsOrder(),
          total: this.cartService.calculateTotal(this.cityCharge),
          paymentMethod: paymentMethod
        };

        this.orderService.create(orderData).subscribe({
          next: (res) => {
            if (paymentMethod === 'mercadoPago' && res.data?.init_point) {
              window.location.href = res.data.init_point; // redirigir a MP
            } else {
              this.utils.showAlert('success', 'Muchas gracias por su compra', 'La compra se ha concretado con éxito.');
              this.cartService.clearCart();
              this.items = [];
              this.totalAmount = 0;
              this.productService.loadProducts();
              this.router.navigate(['/products']);
            }
          },
          error: (err) => {
            console.error('Error creando la orden:', err);
            this.utils.showAlert('error', 'Error', 'Ocurrió un error al procesar la orden.');
          },
        });
      })
      .catch((error) => {
        console.error('Error verificando stock:', error);
        this.utils.showAlert('error', 'Error', 'Ocurrió un error al verificar el stock.');
      });
  }

  // ==========================
  // Datos del usuario
  // ==========================
  loadUserData(): void {
    const user = this.authService.getLoggedUser();

    if (user) {
      this.userService.findUserByEmail(user.email).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.userData = response.data;
            if (this.userData.city) {
              this.cityService.findCityById(this.userData.city).subscribe({
                next: (cityResponse) => {
                  if (cityResponse?.data?.surcharge !== undefined) {
                    this.cityCharge = cityResponse.data.surcharge;
                  } else {
                    this.cityCharge = 0;
                  }
                  this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
                },
                error: (err) => {
                  console.error("Error cargando datos de la ciudad:", err);
                  this.cityCharge = 0;
                  this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
                },
              });
            } else {
              this.cityCharge = 0;
              this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
            }
          }
        },
        error: (err) => {
          console.error("Error al buscar usuario por email:", err);
        },
      });
    }
  }
}
