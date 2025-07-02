import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; 
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private URL = `${environment.apiUrl}api`; 
  private categoriesSubject = new BehaviorSubject<any[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.loadCategories();
  }

  private loadCategories() {
    this.findAll().subscribe((response:any)=> {
      this.categoriesSubject.next(response.data);});
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  add(categoryData: any): Observable<any> { 
    return this.http.post<any>(this.URL + '/categories', categoryData, { headers: this.getAuthHeaders() }).pipe(tap(() => {
      this.loadCategories();
      this.categoriesSubject.next([...this.categoriesSubject.getValue(), categoryData]);
    }));
  }

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/categories`);
   }

  delete(categoryId: any): Observable<any> {
    const deleteUrl = `${this.URL}/categories/${categoryId}`;
    return this.http.delete(deleteUrl, {headers: this.getAuthHeaders() }).pipe(

      tap(() => {
        this.loadCategories();
        this.categoriesSubject.next(this.categoriesSubject.value.filter(category => category.id !== categoryId));
      })
    );
  }

  update(category: any): Observable<any> {
    const url = `${this.URL}/categories/${category.id}`;
    return this.http.put(url, category, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error:', error);
        return throwError(error); 
      })
    );
  }

  findProductsByCategory(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/categories/${name}/products`);
  }

  findCategoryByName(name: string): Observable<any> {
    const url =`${this.URL}/categories/${name}`;
    return this.http.get(url,{ headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null); 
      })
    );
  }
}
