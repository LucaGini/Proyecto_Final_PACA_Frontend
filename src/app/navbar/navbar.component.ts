import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarEventService } from '../services/nav-bar-event.service';
import { CartService } from '../services/cart.service';
import { LoginService } from '../services/login.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { EditGuardService } from '../services/edit-guard.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  categories: any[] = [];

  isLoggedIn: boolean = false;
  isAdmin: boolean = false;
  isDriver: boolean = false;

  cartCount: number = 0;
  private cartSub!: Subscription;

  showCart = false;

  constructor(
    private router: Router,
    private navbarEventService: NavBarEventService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    this.loadCategories();

    this.categoryService.categories$.subscribe((categories: any[]) => {
      this.categories = categories;
    });

    this.authService.isLoggedIn$().subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.authService.isAdmin$().subscribe((status) => {
      this.isAdmin = status;
    });

    this.authService.isDriver$().subscribe((status) => {
      this.isDriver = status;
    });

    this.cartCount = this.cartService.getItems().reduce((acc, item) => acc + item.quantity, 0);
    this.cartSub = this.cartService.itemsChanged$.subscribe((items) => {
      this.cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
  }

  openCart() {
    this.showCart = false; // Fuerza destrucción
    setTimeout(() => (this.showCart = true), 0); // Vuelve a crear
  }

  async navigateToProducts() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['/products']);
    }
  }

  async logout(): Promise<void> {
    // Verificar si hay cambios sin guardar antes de cerrar sesión
    const canContinue = await this.editGuardService.handleUnsavedChanges();

    if (canContinue) {
      this.authService.logout();
    }
    // Si no puede continuar, no hace nada (se queda en la página)
  }

  loadCategories() {
    this.categoryService.findAll().subscribe(
      (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.categories = response.data;
        } else {
          console.error('Expected an array of categories, but got:', response);
        }
      },
      (error) => {
        console.error('Error fetching categories:', error);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.cartSub) {
      this.cartSub.unsubscribe();
    }
  }

  async Home() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['about-us']);
    }
  }

  async UserRegistration() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['UserRegistration']);
    }
  }

  async AdminProducts() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminProducts']);
    }
  }

  async AdminProvinces() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminProvinces']);
    }
  }

  async AdminCategories() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminCategories']);
    }
  }

  async AdminCities() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminCities']);
    }
  }

  async AdminSuppliers() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminSuppliers']);
    }
  }

  async UserList() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['UserList']);
    }
  }

  async OrderList() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['OrderList']);
    }
  }

  async UserInformation() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['UserInformation']);
    }
  }

  async OrdersHistory() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['OrdersHistory']);
    }
  }

  async Route() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['vrp']);
    }
  }

  async Dashboard() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['Dashboard']);
    }
  }

  async DeliveryReport() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['vrp-list']);
    }
  }

  async AdminDrivers() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.router.navigate(['AdminDrivers']);
    }
  }

  async onCategoryButtonClick(name: string) {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.navbarEventService.emitCategoryButtonClick(name);
      this.router.navigate([`collection/${name}`]);
    }
  }
  finishOrder() {
    this.cartService.setOrderFinished(true);
  }

  async finishOrderAndNavigate() {
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (canContinue) {
      this.finishOrder();
      this.router.navigate(['/cart']);
    }
  }

  async onSearch(event: Event) {
    event.preventDefault();
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const query = searchInput.value.trim();

    if (!query) {
      Swal.fire('Ingrese un término para buscar', '', 'warning');
      return;
    }

    // Verificar si hay cambios sin guardar antes de buscar
    const canContinue = await this.editGuardService.handleUnsavedChanges();
    if (!canContinue) {
      return; // No continuar con la búsqueda si el usuario cancela
    }

    this.productService.searchProducts(query).subscribe(
      (response: any) => {
        if (response.message === 'found products' && response.data.length > 0) {
          // Emit the search results event
          this.navbarEventService.emitSearchResults(response.data);
          // Navigate to the products page with the search query
          this.router.navigate(['/products'], { queryParams: { q: query } }).then(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            searchInput.value = ''; // Limpiar el input después de la búsqueda
          });
        } else {
          // No se encontraron productos, mostrar array vacío para que aparezca el mensaje visual
          this.navbarEventService.emitSearchResults([]);
          // Navigate to the products page with the search query to maintain search state
          this.router.navigate(['/products'], { queryParams: { q: query } }).then(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            searchInput.value = ''; // Limpiar el input
          });
        }
      },
      (error: any) => {
        console.error('Error searching products:', error);
        Swal.fire('Ha ocurrido un error al intentar buscar productos', '', 'error');
      }
    );
  }
  openManual(): void {
  let pdfPath = '';

  if (this.isAdmin) {
    pdfPath = 'assets/manual_usuario/manual_administrador.pdf';
  } else if (this.isDriver) {
    pdfPath = 'assets/manual_usuario/manual_conductor.pdf';
  } else {
    pdfPath = 'assets/manual_usuario/manual_usuario.pdf';
  }

  window.open(pdfPath, '_blank');
}

}
