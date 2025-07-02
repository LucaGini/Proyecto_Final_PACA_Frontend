import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})

export class ProductDetailsComponent implements OnInit {
  product: any | undefined;
  products: any | undefined;
  apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,

  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams) => {
      const searchTerm = queryParams['q'];

      this.productService.findAll().subscribe((data:any) => {
        this.products = data.data;  // dentro de data están los productos

        this.buildData()
      });
    })
  }

  public buildData() {
    // First get the product id from the current route.
    const routeParams = this.route.snapshot.paramMap;
    const productIdFromRoute = routeParams.get('productId');

    // Find the product that correspond with the id provided in route.
    this.product = this.products.find((product: any) => product.id === productIdFromRoute);
  }

  public addToCart(product: any) {
    this.productService.verifyStock(product.id, 1).subscribe({
      next: () => {
        this.cartService.addToCart(product);
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Lo sentimos',
          text: `No hay stock suficiente para el producto ${product.name}`,
        });
      }
    });
  }  
  showDeleteButton(): Boolean{
    return !this.authService.isAdmin();
  } 
}
