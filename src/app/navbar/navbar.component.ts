import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarEventService } from '../services/nav-bar-event.service';
import { CarouselComponent } from 'ngx-bootstrap/carousel';
import { CartService } from '../services/cart.service';
import { LoginService } from '../services/login.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';	
import { CategoryService } from '../services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
  categories: any[] = [];
  
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private router: Router,
    private navbarEventService: NavBarEventService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private loginService: LoginService  
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
  }
  logout(): void {
    this.authService.logout();
  }

  loadCategories(){
    this.categoryService.findAll().subscribe((response: any) => {
      if (response && Array.isArray(response.data)) {
        this.categories = response.data;
      } else {
        console.error('Expected an array of categories, but got:', response);
      }
  }, error => {
    console.error('Error fetching categories:', error);
  });
  }
  
  UserRegistration (){
    this.router.navigate(['UserRegistration']);
  }

  AdminProducts() {
    this.router.navigate(['AdminProducts']);
  }

  AdminProvinces() {
    this.router.navigate(['AdminProvinces']);
  }

  AdminCategories() {
    this.router.navigate(['AdminCategories']);
  }

  AdminCities() {
    this.router.navigate(['AdminCities']);
  }

  AdminSuppliers() {
    this.router.navigate(['AdminSuppliers']);
  }

  UserList() {
    this.router.navigate(['UserList']);
  }

  OrderList(){
    this.router.navigate(['OrderList']);
  }

  UserInformation() {
    this.router.navigate(['UserInformation']);
  }

  OrdersHistory(){
    this.router.navigate(['OrdersHistory']);
  }

  onCategoryButtonClick(name: string) {
    this.navbarEventService.emitCategoryButtonClick(name);
    this.router.navigate([`collection/${name}`]);
  }
  finishOrder() {
    this.cartService.setOrderFinished(true); 
  }

onSearch(event: Event) {
    event.preventDefault();
    const query = (document.getElementById('search-input') as HTMLInputElement).value;
    if (!query) {
      Swal.fire('Ingrese un término para buscar', '', 'warning');
      return;
    }

    this.productService.searchProducts(query).subscribe(
      (response: any) => {
        if (response.message === 'found products' && response.data.length > 0) {
          // Emit the search results event
          this.navbarEventService.emitSearchResults(response.data);
          // Navigate to the body component with the search query
          this.router.navigate(['/'], { queryParams: { q: query } }).then(()=>{
            window.scrollTo({ top: 0, behavior: 'smooth' });
          })
        } else {
          Swal.fire('No se encuentran productos que cumplan con la búsqueda', '', 'info');
          // Fetch all products and emit the event
          this.productService.findAll().subscribe((allProductsResponse: any) => {
            this.navbarEventService.emitSearchResults(allProductsResponse.data);
            // Navigate to the body component without query params
            this.router.navigate(['/']);
          });
        }
      },
      (error: any) => {
        console.error('Error searching products:', error);
        Swal.fire('Ha ocurrido un error al intentar buscar productos', '', 'error');
      }
    );
  }
}
