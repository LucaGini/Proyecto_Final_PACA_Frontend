import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

    getProductsByCategory (name: string) {
        this.categoryName = name; // Guardar el nombre de la categoría
        this.categoryService.findActiveProductsByCategory(name).subscribe((data:any) => {
            // Verificar si hay productos en la categoría
            if (data && data.data && data.data.length > 0) {
                this.products = data.data;
            } else {
                this.products = []; // Vaciar products cuando no hay productos en la categoría
            }
        });
    }
}  
