import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
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
export class CartComponent implements OnInit {

  items: any[] = [];
  totalAmount: number = 0; 
  private destroy$ = new Subject<void>();
  showConfirmButton: boolean = false;
  apiUrl = environment.apiUrl;
  userData: any = null;
  cityCharge: number = 0;

  get isCartEmpty(): boolean {
    return this.items.length === 0;
  }

  getImageUrl(imageUrl: string): string {
    // Si la imagen ya es una URL completa (Cloudinary), la retornamos tal como está
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    // Si no, concatenamos con la apiUrl para imágenes locales
    return this.apiUrl + imageUrl;
  }

  constructor(
    private router: Router,
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

    // Solo mostrar el botón de confirmar compra si estamos en la ruta /cart
    this.showConfirmButton = this.router.url === '/cart';
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyStock(item: any, operation: string) {
    const newQuantity = operation === 'compra' ? item.quantity + 1 : item.quantity - 1; 
    if (newQuantity < 1) {
      return this.removeItem(item); 
    }
    this.productService.verifyStock(item.id, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
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

  confirmPurchase() {
    // Verificar si el carrito está vacío
    if (this.isCartEmpty) {
      this.utils.showAlert('warning', 'Carrito vacío', 'Debes agregar productos al carrito para poder confirmar una compra.');
      return;
    }

    if (!this.userData) { this.utils.showAlert('error', 'Acción no permitida', 'Debes iniciar sesión para confirmar tu compra.'); 
      this.router.navigate(['UserRegistration/login']);
      return;
    }

    this.utils.showConfirm( '¿Desea enviar la compra a su dirección registrada?', `Dirección registrada: ${this.userData.street} ${this.userData.streetNumber}`
    ).then((result) => {
      if (result.isConfirmed) {
        this.createOrder(this.items);
      } else {
        this.utils.showAlert('info', 'Redirigiendo', 'Por favor, actualice su dirección.');
        setTimeout(() => {
          this.router.navigate(['UserInformation']);
        }, 2000);
      }
    });
  }

  createOrder(items: any[]) {
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
          total: this.cartService.calculateTotal(this.cityCharge)
        };

        this.orderService.create(orderData).subscribe({
          next: () => {
            this.utils.showAlert('success', 'Muchas gracias por su compra', 'La compra se ha concretado con éxito.');
            this.cartService.clearCart();
            this.items = [];
            this.totalAmount = 0;
            this.productService.loadProducts();
            this.router.navigate(['/']);
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

  loadUserData(): void {
    const user = this.authService.getLoggedUser();

    if (user) {
      this.userService.findUserByEmail(user.email).subscribe({
        next: (data) => {
          this.userData = data.data;

          this.cityService.findOne(this.userData.city).subscribe({
            next: (city) => {
              if (city && city.data.surcharge !== undefined) {
                this.cityCharge = city.data.surcharge;
                this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
              } else {
                console.error("City no contiene un surcharge válido:", city);
              }
            },
            error: (err) => {
              console.error("Error cargando datos de la ciudad:", err);
            },
          });
        },
        error: (err) => {
          console.error("Error al buscar usuario por email:", err);
        },
      });
    } else {
      console.error("No se encontró un usuario logueado.");
    }
  }
}
