import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { CartService } from '../services/cart.service'; // NUEVO
import { AuthService } from '../services/auth.service'; // NUEVO
import { ProductService } from '../services/product.service'; // NUEVO
import Swal from 'sweetalert2'; // NUEVO

@Component({
    selector: 'app-collection',
    templateUrl: './collection.component.html',
    styleUrls: ['./collection.component.scss']
})
export class CollectionComponent implements OnInit {
    urlPath: string = ''
    products: any[] = [];
    categoryName: string = '';
    apiUrl = environment.apiUrl;
    cartItems: any[] = []; // NUEVO

    constructor(
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute,
        private cartService: CartService, // NUEVO
        private authService: AuthService, // NUEVO
        private productService: ProductService // NUEVO
    ) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.getProductsByCategory(this.getCurrentRoute());
        });
    }

    ngOnInit() {
        this.getProductsByCategory(this.getCurrentRoute());
        // Suscribirse a cambios del carrito
        this.cartItems = this.cartService.getItems();
        this.cartService.itemsChanged$.subscribe((items) => {
            this.cartItems = items;
        });
    }

    getImageUrl(imageUrl: string): string {
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            return imageUrl;
        }
        return this.apiUrl + imageUrl;
    }

    getCurrentRoute (): string {
        if (this.router.url.split('collection/').length === 0) return this.urlPath
        this.urlPath = this.router.url.split('collection/')[1]
        return this.urlPath
    }

    getProductsByCategory (name: string) {
        this.categoryName = name;
        this.categoryService.findActiveProductsByCategory(name).subscribe((data:any) => {
            if (data && data.data && data.data.length > 0) {
                this.products = data.data;
            } else {
                this.products = [];
            }
        });
    }

    // --- NUEVOS MÉTODOS PARA EL CARRITO ---

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
}
