import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; 
import { catchError, tap } from 'rxjs/operators';
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

  add(supplierData: any): Observable<any> {
    return this.http.post<any>(this.URL + '/suppliers', supplierData,{ headers: this.getAuthHeaders() })
    .pipe(tap(() => this.loadSuppliers()));
  }

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL + '/suppliers');
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
      catchError((error: any) => {
        console.error('Error en la solicitud findOne:', error); // si no lo encuentra tira el 404 
        return of(null);  // se le asigna el valor para despues compara en el .ts 
      })
    );
  }
  
  findProductsBySupplier(cuit: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/suppliers/${cuit}/products`, { headers: this.getAuthHeaders() });
  }  
}
