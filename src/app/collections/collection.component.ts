import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PaginationMetadata } from '../models/pagination.interface';

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

    // Pagination properties
    pagination: PaginationMetadata | null = null;
    currentPage = 1;
    pageSize = 12; // Good size for product display

    getImageUrl(imageUrl: string): string {
        // Si la imagen ya es una URL completa (Cloudinary), la retornamos tal como está
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            return imageUrl;
        }
        // Si no, concatenamos con la apiUrl para imágenes locales
        return this.apiUrl + imageUrl;
    }

    constructor(
        private categoryService: CategoryService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.getProductsByCategory(this.getCurrentRoute());
        });
    }

    ngOnInit() {
        this.getProductsByCategory(this.getCurrentRoute())
    }

    getCurrentRoute (): string {
        if (this.router.url.split('collection/').length === 0) return this.urlPath
        this.urlPath = this.router.url.split('collection/')[1]

        return this.urlPath
    }

    getProductsByCategory (name: string, page: number = 1, limit: number = this.pageSize) {
        this.categoryName = name; // Guardar el nombre de la categoría
        this.categoryService.findActiveProductsByCategoryPaginated(name, page, limit).subscribe({
            next: (response) => {
                this.products = response.data;
                this.pagination = response.pagination;
                this.currentPage = page;
            },
            error: (error) => {
                console.error('Error loading products by category:', error);
                // Fallback to original method
                this.categoryService.findActiveProductsByCategory(name).subscribe((data:any) => {
                    if (data && data.data && data.data.length > 0) {
                        this.products = data.data;
                    } else {
                        this.products = [];
                    }
                });
            }
        });
    }

    // Pagination handlers
    onPageChange(page: number): void {
        this.getProductsByCategory(this.categoryName, page, this.pageSize);
    }

    onPageSizeChange(newSize: number): void {
        this.pageSize = newSize;
        this.currentPage = 1;
        this.getProductsByCategory(this.categoryName, 1, newSize);
    }
}  
