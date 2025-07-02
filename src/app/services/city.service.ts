import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs'; 
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment'; 

@Injectable({
  providedIn: 'root'
})
export class CityService {
  private URL = `${environment.apiUrl}api`; 
  private citiesSubject = new BehaviorSubject<any[]>([]);
  cities$ = this.citiesSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCities();
  }
  
  private loadCities() {
    this.findAll().subscribe((response:any)=> {
      this.citiesSubject.next(response.data);
    })
  }

  private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('access_token');
        return new HttpHeaders({
          'Authorization': token ? `Bearer ${token}` : ''
        });
      }

  add(cityData: any): Observable<any> { 
    return this.http.post<any>(this.URL + '/cities', cityData, { headers: this.getAuthHeaders() }).pipe(tap(() => this.loadCities()));
  }
  
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL + '/cities');
  }

  findOne(id: string): Observable<any> {
    const url =`${this.URL}/cities/${id}`;
    return this.http.get(url).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null); 
      })
    );
  }
  
  delete(cityId: any) {
    const deleteUrl = `${this.URL}/cities/${cityId}`;
    return this.http.delete(deleteUrl, { headers: this.getAuthHeaders() });
  }
  
  update(city: any): Observable<any> {
    const url = `${this.URL}/cities/${city.id}`;
    return this.http.put(url, city, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud de actualización:', error);
        return throwError(() => error); 
      })
    );
  }
  

  findCityByPostCode(postCode: string): Observable<any> {
    const url =`${this.URL}/cities/postCode/${postCode}`;
    return this.http.get(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null); 
      })
    );
  }

  findCityById(cityId: string): Observable<any> {
    const url = `${this.URL}/cities/${cityId}`;
    return this.http.get(url, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error fetching city:', error);
        return of(null); 
      })
    );
  }
  findUsersByCity(postCode: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/cities/${postCode}/users`, { headers: this.getAuthHeaders() });
  }
}

