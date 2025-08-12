import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams  } from '@angular/common/http'; // Asegúrate de incluir esto
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from './userInterface'; // Asegúrate de que la ruta sea correcta

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
    const token = localStorage.getItem('access_token'); // Usar la misma clave que AuthService
    console.log('🔑 Token obtenido:', token ? 'Token presente' : 'No hay token');
    console.log('🔑 Token completo:', token);
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
  findAll(): Observable<any[]> {
    return this.http.get<any[]>(this.URL + '/users');
  }

  signUp(userData: any): Observable<any> { 
    return this.http.post<any>(this.URL + '/users', userData,{ headers: this.getAuthHeaders() });
  }

findUserByEmail(email: string): Observable<any> {
  const url = `${this.URL}/users/by-email?email=${email}`; 
  console.log('🌐 Haciendo petición a:', url);
  // El interceptor se encarga automáticamente de agregar los headers de autorización
  return this.http.get<any>(url).pipe(
    map(response => {
      console.log('📦 Respuesta del backend:', response);
      // Devolver la respuesta completa para que el componente pueda acceder a response.data
      return response;
    }),
    catchError((error: any) => {
      console.error('❌ Error en findUserByEmail:', error);
      if (error.status === 404) {
        console.log('🔍 Usuario no encontrado (404)');
        return of(null); // Usuario no encontrado → null
      } else {
        console.error('💥 Error en la solicitud:', error);
        return throwError(() => error);
      }
    })
  );
}

  updatePassword(email: string, password: string): Observable<any> {
    const url = `${this.URL}/users/update-password`;
    return this.http.put<any>(url, { email, password},{ headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error al actualizar contraseña:', error);
        return of(null); 
      })
    );
  }

  delete(userId: any): Observable<void> {
    return this.http.delete<void>(`${this.URL}/users/${userId}`)
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
getUsers(isActive: boolean | null, searchTerm?: string): Observable<User[]> {
    let params = new HttpParams();

    if (isActive !== null) {
      params = params.set('isActive', isActive.toString());
    }

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('q', searchTerm.trim());
    }

    return this.http.get<User[]>(`${this.URL}/users`, { params });
  }
}
