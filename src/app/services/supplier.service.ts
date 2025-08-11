import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; 
import { catchError, tap,map} from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private URL = `${environment.apiUrl}api`; 
  private suppliersSubject = new BehaviorSubject<any[]>([]);
  suppliers$ = this.suppliersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.loadSuppliers();
  }

  private loadSuppliers() {
    this.findAll().subscribe((response:any)=> {
      this.suppliersSubject.next(response.data);});
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
    findOne(id: string): Observable<any> {
    const url =`${this.URL}/suppliers/by-id/${id}`;
    return this.http.get(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null); 
      })
    );
  }
  

  add(supplierData: any): Observable<any> {
    return this.http.post<any>(this.URL + '/suppliers', supplierData,{ headers: this.getAuthHeaders() })
    .pipe(tap(() => this.loadSuppliers()));
  }

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL + '/suppliers', { headers: this.getAuthHeaders() })
  }

  delete(supplierId: any) {
    const deleteUrl = `${this.URL}/suppliers/${supplierId}`;
    return this.http.delete(deleteUrl, { headers: this.getAuthHeaders() })
  }

  update(supplier: any): Observable<any> {
    const url = `${this.URL}/suppliers/${supplier.id}`;
    return this.http.put(url, supplier, { headers: this.getAuthHeaders() }).pipe( // lo volví a poner en put pq cambiamos todos los datos (antes habíamos dejado el cuit como fijo)
      catchError((error: any) => {
        console.error('Error:', error);
        return throwError(error); 
      })
    );
  }
  
  findSupplierByCuit(cuit: number): Observable<any> {
    const url =`${this.URL}/suppliers/${cuit}`;
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
  
  findProductsBySupplier(cuit: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/suppliers/${cuit}/products`, { headers: this.getAuthHeaders() });
  }  

  requestRestockEmail(productId: string, supplierId: string) {
  const url = `http://localhost:3000/api/suppliers/restock/${supplierId}`;
  return this.http.post(url, { productId }, { headers: this.getAuthHeaders() }).pipe(
    tap(response => {
      
    }),
    catchError(error => {
      return throwError(() => error);
    })
  );
}
}
