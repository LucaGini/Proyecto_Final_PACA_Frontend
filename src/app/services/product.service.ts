import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable , of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private URL = `${environment.apiUrl}api`; 
  private productsSubject = new BehaviorSubject<any[]>([]);
  products$ = this.productsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadProducts();
  }

loadProducts() {
    this.findAll().subscribe((response:any)=> {
      this.productsSubject.next(response.data);});
  }

  private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('access_token');
      return new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }

  add(productData: FormData): Observable<any> { 
    return this.http.post<any>(`${this.URL}/products`, productData, { headers: this.getAuthHeaders() }).pipe(tap(() => this.loadProducts()));
  }

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/products`);
  }

  findActive(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/products/active-products`); 
  }

  delete(productId: string): Observable<any> {
    const url =  this.http.delete(`${this.URL}/products/${productId}`, { headers: this.getAuthHeaders() })
    return url.pipe(
    tap(() => {
      this.loadProducts(); 
    }),
    catchError((error: any) => {
      console.error('Error deletinting product:', error);
      return throwError(error);
    })
  );

  }
  
  update(product: any): Observable<any> {
    const productId = product instanceof FormData ? product.get('id') : product.id;
    
    return this.http.put(`${this.URL}/products/${productId}`, product, { headers: this.getAuthHeaders() })
    .pipe(catchError((error: any) => {
        console.error('Error en la solicitud de actualización:', error);
        return throwError(error); 
      })
    );
  }

  updateWithImage(product: any, imageFile: File): Observable<any> {
    const formData = new FormData();
    
    // Agregar todos los campos del producto al FormData (igual que en el método add)
    Object.keys(product).forEach(key => {
      if (key !== 'id') { // No agregar el ID como campo, se usa en la URL
        formData.append(key, product[key]);
      }
    });
    
    // Agregar la imagen
    formData.append('image', imageFile, imageFile.name);
    
    return this.http.put(`${this.URL}/products/${product.id}`, formData, { headers: this.getAuthHeaders() })
    .pipe(
      tap(() => this.loadProducts()),
      catchError((error: any) => {
        console.error('Error en la solicitud de actualización con imagen:', error);
        return throwError(error); 
      })
    );
  }
  
  findProductByName(name: string): Observable<any> {
    const url =`${this.URL}/products/product/${name}`;
    return this.http.get(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => { 
        return null;
       }),
       catchError((error: any) => {
         if (error.status === 404) {
           return of(error.error?.data ?? true); 
         } else {
           console.error('Error en la solicitud:', error);
           throw error;
         }
       })
     );
   }

searchProducts(query: string): Observable<any> {
  return this.http.get<any>(`${this.URL}/products/search?query=${encodeURIComponent(query)}`).pipe(
    catchError((error: any) => {
      console.error('Error searching products:', error);
      return throwError(error);
    })
  );
}

  verifyStock(productId: string, quantity: number): Observable<any> {
  return this.http.get(`${this.URL}/products/${productId}/verify-stock?quantity=${quantity}`);
} 

findOne(productId: string): Observable<any> {
  const url =`${this.URL}/products/${productId}`;
  return this.http.get(url).pipe(
    catchError((error: any) => {
      console.error('Error en la solicitud:', error);
      return of(null); 
    })
  );
}
reactivateProduct(productId: string) {
  const url = this.http.put(`${this.URL}/products/${productId}/reactivate`, { headers: this.getAuthHeaders()  });
  return url.pipe(
    tap(() => {
      this.loadProducts(); 
    }),
    catchError((error: any) => {
      console.error('Error reactivating product:', error);
      return throwError(error);
    })
  );

}

}