import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { ProductService } from '../services/product.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CityService } from '../services/city.service';
import { OrderService } from '../services/order.service';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  items: any[] = [];
  totalAmount: number = 0; 
  private destroy$ = new Subject<void>();
  showConfirmButton: boolean = false
  apiUrl = environment.apiUrl;
  userData: any = null; // Datos del usuario logueado
  cityCharge: number = 0;

  constructor(
    private router: Router,
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private userService: UserService,
    private cityService: CityService,
    private orderService: OrderService
  ) {}
  ngOnInit() {
    this.items = this.cartService.getItems();
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
  
    // Cambios en el carrito
    this.cartService.itemsChanged$
  .pipe(takeUntil(this.destroy$))
  .subscribe((updatedItems: any[]) => {
    this.items = updatedItems;
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
  });

  
    this.showConfirmButton = this.cartService.isOrderFinished();
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeCart() {
    this.items.forEach(item => {
      item.quantity = item.quantity || 1;
      item.totalAmount = 0; 
    });
  }
  verifyStock(item: any, operation: string) {
    const newQuantity = operation === 'compra' ? item.quantity + 1 : item.quantity - 1; 
    if (newQuantity < 1) {
      return this.removeItem(item); 
    }
    this.productService.verifyStock(item.id, newQuantity).subscribe({
      next: () => {
        item.quantity = newQuantity;
        this.totalAmount =  this.cartService.calculateTotal(this.cityCharge)
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Lo sentimos',
          text: `No hay stock suficiente para el producto ${item.name}`,
        });
      }
    });
  }
  
  removeItem(item: any) {  
    this.cartService.removeFromCart(item);
    this.totalAmount =  this.cartService.calculateTotal(this.cityCharge)
    
  }
  confirmPurchase() {
    if (!this.userData) {
      Swal.fire({
        icon: 'error',
        title: 'Acción no permitida',
        text: 'Debes iniciar sesión para confirmar tu compra.',
      });
      this.router.navigate(['UserRegistration/login']);
      return;
    }
  
    Swal.fire({
      title: '¿Desea enviar la compra a su dirección registrada?',
      text: `Dirección registrada: ${this.userData.street} ${this.userData.streetNumber}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, usar esta dirección',
      cancelButtonText: 'No, quiero cambiarla',
      confirmButtonColor: '#e7c633',
      cancelButtonColor: '#f76666',
    }).then((result) => {
      if (result.isConfirmed) {
        this.createOrder(this.items);
      } else {
        // Si elige cambiar la dirección, redirige al componente de edición de datos
        Swal.fire({
          icon: 'info',
          title: 'Redirigiendo',
          text: 'Por favor, actualice su dirección.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['UserInformation']);
        });
      }
    });
  }
  createOrder(items: any[]) {
    // ACA SE VALIDA QUE HAYA STOCK SUFICIENTE
    let stockErrorProducts: string[] = [];
    const verifyStockPromises = items.map((item) =>
      this.productService.verifyStock(item.id, item.quantity).toPromise().catch(() => {
        stockErrorProducts.push(item.name);
      })
    );
  
    Promise.all(verifyStockPromises)
      .then(() => {
        if (stockErrorProducts.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'Stock insuficiente',
            text: `No hay suficiente stock para los siguientes productos: ${stockErrorProducts.join(', ')}`,
          });
          return;
        }
        const orderData = {
          userId: this.userData.id, 
          orderItems: this.cartService.getItemsOrder(), 
          total: this.cartService.calculateTotal(this.cityCharge)
        };
        this.orderService.create(orderData).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Muchas gracias por su compra',
              text: `La compra se ha concretado con éxito.`,
            });
            this.cartService.clearCart();
            this.items = [];
            this.totalAmount = 0;
            this.productService.loadProducts();
            this.router.navigate(['/']);
          },
          error: (err) => {
            console.error('Error creando la orden:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al procesar la orden.',
            });
          },
        });
      })
      .catch((error) => {
        console.error('Error verificando stock:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al verificar el stock.',
        });
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
              this.totalAmount =  this.cartService.calculateTotal(this.cityCharge)
              
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