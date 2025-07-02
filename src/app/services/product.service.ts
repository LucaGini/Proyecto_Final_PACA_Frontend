import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable , of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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

  delete(productId: string): Observable<any> {
    return this.http.delete(`${this.URL}/products/${productId}`, { headers: this.getAuthHeaders() })
  }
  
  update(product: any): Observable<any> {
    return this.http.put(`${this.URL}/products/${product.id}`, product, { headers: this.getAuthHeaders() })
    .pipe(catchError((error: any) => {
        console.error('Error en la solicitud de actualización:', error);
        return throwError(error); 
      })
    );
  }
  
  findProductByName(name: string): Observable<any> {
    const url =`${this.URL}/products/product/${name}`;
    return this.http.get(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null); 
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
}