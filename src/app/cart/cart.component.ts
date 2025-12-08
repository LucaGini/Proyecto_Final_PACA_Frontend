import { Component, Input, OnInit } from '@angular/core';
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
import { ProvinceService } from '../services/province.service';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  items: any[] = [];
  totalAmount: number = 0;
  private destroy$ = new Subject<void>();

  provinces: any[] = [];
  cities: any[] = [];
  selectedProvince: string = '';
  selectedCity: string = '';

  @Input() isModal: boolean = false; // <- esto permite pasar el valor desde el navbar
  @Input() showConfirmButton: boolean = true;

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
    private utils: UtilsService,
    private provinceService: ProvinceService
  ) {}

  ngOnInit() {
    // Cargar provincia y ciudad desde CartService o localStorage
    this.selectedProvince = this.cartService.selectedProvince || localStorage.getItem('selectedProvince') || '';
    this.selectedCity = this.cartService.selectedCity || localStorage.getItem('selectedCity') || '';

    // Cargar items del carrito y calcular total
    this.items = this.cartService.getItems();
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);

    // Suscribirse a cambios del carrito
    this.cartService.itemsChanged$.pipe(takeUntil(this.destroy$)).subscribe((updatedItems: any[]) => {
      this.items = updatedItems;
      this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
    });

    // Mostrar botón de confirmar solo en la página /cart
    this.showConfirmButton = this.router.url === '/cart';

    // Cargar datos del usuario
    this.loadUserData();

    // Si no hay usuario logueado, cargar provincias
    if (!this.userData) {
      this.loadProvinces();
    }

    // Si ya había provincia seleccionada, cargar sus ciudades
    if (this.selectedProvince) {
      this.provinceService.findCitiesByProvince(this.selectedProvince).subscribe({
        next: (data: any[]) => {
          this.cities = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          console.error('Error cargando ciudades', err);
          this.cities = [];
        },
      });
    }

    // Si ya había ciudad seleccionada, cargar recargo
    if (this.selectedCity) {
      this.cityService.findCityById(this.selectedCity).subscribe({
        next: (res) => {
          this.cityCharge = res?.data?.surcharge ?? 0;
          this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        },
        error: (err) => {
          console.error('Error cargando recargo de ciudad', err);
          this.cityCharge = 0;
          this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        },
      });
    }
  }

  loadProvinces() {
    this.provinceService.findAll().subscribe({
      next: (data: any[]) => {
        this.provinces = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error cargando provincias', err);
        this.provinces = [];
      },
    });
  }

  onProvinceChange() {
    if (this.selectedProvince) {
      this.cartService.selectedProvince = this.selectedProvince;
      localStorage.setItem('selectedProvince', this.selectedProvince || '');

      this.provinceService.findCitiesByProvince(this.selectedProvince).subscribe({
        next: (data: any[]) => {
          this.cities = Array.isArray(data) ? data : [];
          this.selectedCity = ''; // resetear selección
          this.cityCharge = 0;
          this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        },
        error: (err) => {
          console.error('Error cargando ciudades', err);
          this.cities = [];
        },
      });
    } else {
      this.cities = [];
      this.selectedCity = '';
    }
  }

  onCityChange() {
    if (this.selectedCity) {
      this.cartService.selectedCity = this.selectedCity;
      localStorage.setItem('selectedCity', this.selectedCity || '');

      this.cityService.findCityById(this.selectedCity).subscribe({
        next: (res) => {
          this.cityCharge = res?.data?.surcharge ?? 0;
          this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        },
        error: (err) => {
          console.error('Error cargando recargo de ciudad', err);
          this.cityCharge = 0;
          this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
        },
      });
    } else {
      this.cityCharge = 0;
      this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
    }
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
        this.cartService.updateLocalStorage();
        this.cartService.notifyItemsChanged();
      },
      error: () => {
        this.utils.showAlert('error', 'Lo sentimos', `No hay stock suficiente para el producto ${item.name}`);
      },
    });
  }

  removeItem(item: any) {
    this.cartService.removeFromCart(item);
    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  confirmPurchase() {
    // Verificar si el carrito está vacío
    localStorage.removeItem('selectedProvince');
    localStorage.removeItem('selectedCity');
    if (this.isCartEmpty) {
      this.utils.showAlert('warning', 'Carrito vacío', 'Debes agregar productos al carrito para poder confirmar una compra.');
      return;
    }

    if (!this.userData) {
      if (!this.selectedCity) {
        this.utils.showAlert('error', 'Ciudad requerida', 'Debes seleccionar una ciudad para calcular el total.');
        return;
      }
      this.utils.showAlert('info', 'Inicia sesión', 'Debes iniciar sesión para confirmar tu compra.');
      this.router.navigate(['UserRegistration/login']);
      return;
    }

    const street = this.userData.street || 'Calle no especificada';
    const streetNumber = this.userData.streetNumber || 'S/N';
    const fullAddress = `${street} ${streetNumber}`;

    this.utils.showConfirm('¿Desea enviar la compra a su dirección registrada?', `Dirección registrada: ${fullAddress}`).then((result) => {
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
      this.productService
        .verifyStock(item.id, item.quantity)
        .toPromise()
        .catch(() => {
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
        };

        this.orderService.create(orderData).subscribe({
          next: () => {
            this.utils.showAlert('success', 'Muchas gracias por su compra', 'La compra se ha concretado con éxito.');
            this.cartService.clearCart();
            this.items = [];
            this.totalAmount = 0;
            this.productService.loadProducts();
            this.router.navigate(['/products']);
          },
          error: (err) => {
            console.error('Error creando la orden:', err);
            const backendMessage = err.error?.message || '';
            if (backendMessage.includes('ya no se encuentra a la venta') || backendMessage.includes('no está activo')) {
              this.utils.showAlert('error', 'Producto no disponible', backendMessage);
            } else {
              this.utils.showAlert('error', 'Error', 'Ocurrió un error al procesar la orden.');
            }
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
        next: (response) => {
          if (response && response.data) {
            this.userData = response.data;
            console.log('🛒 Datos de usuario en cart:', this.userData);

            // userData.city contiene el ID de la ciudad, no el nombre
            if (this.userData.city) {
              console.log('🏙️ Buscando ciudad con ID:', this.userData.city);
              this.cityService.findCityById(this.userData.city).subscribe({
                next: (cityResponse) => {
                  console.log('🏙️ Respuesta de ciudad en cart:', cityResponse);
                  if (cityResponse && cityResponse.data && cityResponse.data.surcharge !== undefined) {
                    this.cityCharge = cityResponse.data.surcharge;
                    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
                    console.log('💰 Surcharge aplicado:', this.cityCharge);
                  } else {
                    console.error('City no contiene un surcharge válido:', cityResponse);
                    this.cityCharge = 0; // Valor por defecto
                    this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
                  }
                },
                error: (err) => {
                  console.error('Error cargando datos de la ciudad:', err);
                  this.cityCharge = 0; // Valor por defecto en caso de error
                  this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
                },
              });
            } else {
              console.warn('Usuario no tiene ciudad asignada');
              this.cityCharge = 0;
              this.totalAmount = this.cartService.calculateTotal(this.cityCharge);
            }
          } else {
            console.error('No se encontraron datos de usuario');
          }
        },
        error: (err) => {
          console.error('Error al buscar usuario por email:', err);
        },
      });
    } else {
      console.error('No se encontró un usuario logueado.');
    }
  }
}
