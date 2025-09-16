import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from 'src/environments/environment';

type DecodeUserPayload = {
  email: string;
  privilege: 'usuario' | 'administrador' | 'transportista';
  iat: number;
  exp: number;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private URL = `${environment.apiUrl}api`;
  private tokenKey = 'access_token';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkToken());
  private isAdminInSubject = new BehaviorSubject<boolean>(this.checkAdmin());
  private isDriverSubject = new BehaviorSubject<boolean>(this.checkDriver());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.tokenKey);
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private checkToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  }

  private checkAdmin(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try {
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      return decodedToken.privilege === 'administrador';
    } catch {
      return false;
    }
  }

  private checkDriver(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try {
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      return decodedToken.privilege === 'transportista';
    } catch {
      return false;
    }
  }

  isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  isAdmin$(): Observable<boolean> {
    return this.isAdminInSubject.asObservable();
  }

  isDriver$(): Observable<boolean> {
    return this.isDriverSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  isAdmin(): boolean {
    return this.checkAdmin();
  }

  isDriver(): boolean {
    return this.checkDriver();
  }

  getLoggedUser(): DecodeUserPayload | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;

    try {
      return jwtDecode(token) as DecodeUserPayload;
    } catch (err) {
      console.log('Error decoding token:', err);
      return null;
    }
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedInSubject.next(true);
    this.isAdminInSubject.next(this.checkAdmin());
    this.isDriverSubject.next(this.checkDriver());
    this.router.navigate(['/']);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
    this.isAdminInSubject.next(false);
    this.isDriverSubject.next(false);
    this.router.navigate(['/UserRegistration']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  sendResetPasswordEmail(email: string): Observable<any> {
    const url = `${this.URL}/auth/password/recovery`;
    return this.http.post<any>(url, { email }, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null);
      })
    );
  }

  sendRequestToLogin(email: string, password: any, captchaToken: string): Observable<any> {
    const url = `${this.URL}/auth/login`;
    return this.http.post<any>(url, { email, password, captchaToken }, { headers: this.getAuthHeaders() }).pipe(
      catchError((err) => {
        console.error('Error en el servicio:', err);
        return throwError(() => err); // Reemite el error
      })
    );
  }

  updateUserEmail(newEmail: string): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      const newToken = {
        ...decodedToken,
        email: newEmail
      };

      // Guardar email actualizado en localStorage
      localStorage.setItem('currentUserEmail', newEmail);
    } catch (error) {
      console.error('Token update failed:', error);
    }
  }
}
