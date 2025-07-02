import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs'; 
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProvinceService {
  private URL = `${environment.apiUrl}api`; 
  private provincesSubject = new BehaviorSubject<any[]>([]);
  provinces$ = this.provincesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadProvinces();
  }

  private loadProvinces() {
    this.findAll().subscribe({
      next: (provinces: any[]) => {
        this.provincesSubject.next(provinces);
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  add(provinceData: any): Observable<any> { 
    return this.http.post<any>(this.URL + '/provinces', provinceData, { headers: this.getAuthHeaders() })
    .pipe(tap(() => this.loadProvinces()));
  }

  findAll(): Observable<any[]> {
    return this.http.get<any>(this.URL + '/provinces').pipe(
      map(response => Array.isArray(response) ? response : response.data || [])
    );
  }

  delete(provinceId: any): Observable<any> {
    return this.http.delete(`${this.URL}/provinces/${provinceId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          this.loadProvinces(); // Reload provinces after deleting
        })
      );
  }
  update(province: any): Observable<any> {
    const updateUrl = `${this.URL}/provinces/${province.id}`;
    return this.http.patch<any>(updateUrl, province, { headers: this.getAuthHeaders() }); 
  }
  
findProvinceByName(name: string): Observable<any> {
  const url =`${this.URL}/provinces/${name}`;
  return this.http.get(url,{ headers: this.getAuthHeaders() }).pipe(
    catchError((error: any) => {
      console.error('Error en la solicitud:', error);
      return of(null); 
    })
  );
}

  findCitiesByProvince(id: string): Observable<any[]> {
    return this.http.get<any>(`${this.URL}/provinces/cities/${id}`).pipe(
      map(response => Array.isArray(response) ? response : response.data || []),
      catchError((error: any) => {
        console.error('Error fetching cities:', error);
        return of([]);
      })
    );
  }
 }