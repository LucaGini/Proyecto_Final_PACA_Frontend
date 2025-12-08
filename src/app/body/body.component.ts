import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { NavBarEventService } from '../services/nav-bar-event.service';
import { CategoryService } from '../services/category.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent implements OnInit {
  products: any[] = [];
  cartItems: any[] = [];
  apiUrl = environment.apiUrl;
  isSearching: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private navBarEventService: NavBarEventService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Cargar productos
    this.route.queryParams.subscribe((queryParams) => {
      const searchTerm = queryParams['q'];
      if (searchTerm) {
        this.isSearching = true;
        this.productService.searchProducts(searchTerm).subscribe((response: any) => {
          this.products = response.message === 'found products' ? response.data : [];
        });
      } else {
        this.isSearching = false;
        this.productService.findActive().subscribe((data: any) => {
          this.products = data.data;
        });
      }
    });

    // Subscribirse a resultados de búsqueda
    this.navBarEventService.searchResults$.subscribe((results: any[]) => {
      this.products = results;
    });

    // 🛒 Escuchar cambios del carrito (reactivo)
    this.cartItems = this.cartService.getItems();
    this.cartService.itemsChanged$.subscribe((items) => {
      this.cartItems = items;
    });
  }

  // 🔗 Imagen
  getImageUrl(imageUrl: string): string {
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    return this.apiUrl + imageUrl;
  }

  // 🛒 Lógica carrito
  isInCart(productId: number): boolean {
    return this.cartItems.some((item) => item.id === productId);
  }

  addToCart(product: any) {
    this.productService.verifyStock(product.id, 1).subscribe({
      next: () => this.cartService.addToCart(product),
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Sin stock',
          text: `No hay stock suficiente para ${product.name}.`,
        });
      },
    });
  }

  removeFromCart(product: any) {
    this.cartService.removeFromCart(product);
    Swal.fire({
      icon: 'info',
      title: 'Producto quitado',
      text: `${product.name} fue eliminado del carrito.`,
      timer: 1500,
      showConfirmButton: false,
    });
  }

  showAddButton(): boolean {
    return !this.authService.isAdmin() && !this.authService.isDriver();
  }

  clearSearch() {
    // Navega a /products sin parámetros
    window.location.href = '/products';
  }
}
