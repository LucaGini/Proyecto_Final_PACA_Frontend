import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Asegúrate de incluir esto
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private URL = `${environment.apiUrl}api`; 

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL + '/users');
  }

  signUp(userData: any): Observable<any> { 
    return this.http.post<any>(this.URL + '/users', userData);
  }

findUserByEmail(email: string): Observable<any> {
  const url = `${this.URL}/users/by-email?email=${email}`; 
  return this.http.get(url).pipe(
    catchError((error: any) => {
      console.error('Error en la solicitud:', error);
      return of(null); 
    })
  );
}

  updatePassword(email: string, password: string): Observable<any> {
    const url = `${this.URL}/users/update-password`;
    return this.http.put<any>(url, { email, password }).pipe(
      catchError((error: any) => {
        console.error('Error al actualizar contraseña:', error);
        return of(null); 
      })
    );
  }

  delete(userId: any): Observable<void> {
    return this.http.delete<void>(`${this.URL}/users/${userId}`,{ headers: this.getAuthHeaders() })
    .pipe(
      catchError(error => {
        console.error('Delete error: ', error);
        return throwError(() => error);
      })
    );
  }

update(user: any): Observable<any> {
  const userId = user.id || user._id;
  if (!userId) {
    console.error('No user ID provided:', user);
    return throwError(() => new Error('No user ID provided'));
  }

  const updateUrl = `${this.URL}/users/${userId}`;
  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    street: user.street,
    streetNumber: user.streetNumber,
    city: user.city,
    email: user.email,
    ...(user.password ? { password: user.password } : {})
  };
  return this.http.put<any>(updateUrl, userData, { headers: this.getAuthHeaders() }).pipe(
    tap(response => console.log('Backend response:', response)),
    catchError(error => {
      console.error('Service error:', error);
      return throwError(() => error);
    })
  );
}
}
