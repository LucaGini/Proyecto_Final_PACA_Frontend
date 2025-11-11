import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; 
import { catchError, tap, map} from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { PaginationMetadata } from '../models/pagination.interface';

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

  findActiveProductsByCategory(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/categories/${name}/products/active-products`);
  }

  // For pagination, we'll use a hybrid approach with active products and client-side filtering
  // This is a temporary solution until backend implements category-specific pagination
  findActiveProductsByCategoryPaginated(name: string, page: number = 1, limit: number = 12): Observable<{data: any[], pagination: PaginationMetadata}> {
    // First, try to use the existing endpoint and create pagination client-side
    return this.findActiveProductsByCategory(name).pipe(
      map((response: any) => {
        const products = response.data || response;
        const totalItems = products.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = products.slice(startIndex, endIndex);
        
        const pagination: PaginationMetadata = {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
          totalItems: totalItems,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalItems / limit),
          hasPrevPage: page > 1
        };

        return {
          data: paginatedProducts,
          pagination: pagination
        };
      })
    );
  }

 findCategoryByName(name: string): Observable<any | null> {
  const url = `${this.URL}/categories/${name}`;
  return this.http.get(url, {
    headers: this.getAuthHeaders(),
    observe: 'response'
  }).pipe(
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
}
