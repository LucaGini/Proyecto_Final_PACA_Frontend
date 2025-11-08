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

declare global {
  interface Window {
    google: any;
  }
}

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

  // === Helpers ==============================================================
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

  // === Estado del usuario ===================================================
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

  // === Auth principal =======================================================
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedInSubject.next(true);
    this.isAdminInSubject.next(this.checkAdmin());
    this.isDriverSubject.next(this.checkDriver());

    // Verificar perfil y redirigir según rol
    this.checkProfileCompletionAndNavigate();
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

  // === Reset password =======================================================
  sendResetPasswordEmail(email: string): Observable<any> {
    const url = `${this.URL}/auth/password/recovery`;
    return this.http.post<any>(url, { email }, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        console.error('Error en la solicitud:', error);
        return of(null);
      })
    );
  }

  // === Login ================================================================
  sendRequestToLogin(email: string, password: any, captchaToken: string): Observable<any> {
    const url = `${this.URL}/auth/login`;
    return this.http.post<any>(url, { email, password, captchaToken }, { headers: this.getAuthHeaders() }).pipe(
      catchError((err) => {
        console.error('Error en el servicio:', err);
        return throwError(() => err);
      })
    );
  }

  // === Update email =========================================================
  updateUserEmail(newEmail: string): void {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return;

    try {
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      const newToken = {
        ...decodedToken,
        email: newEmail
      };
      localStorage.setItem('currentUserEmail', newEmail);
    } catch (error) {
      console.error('Token update failed:', error);
    }
  }

  // === Google OAuth =========================================================
  initializeGoogleSignIn(): void {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => this.handleGoogleResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });
    }
  }

  handleGoogleResponse(response: any): void {
    this.sendGoogleTokenToBackend(response.credential).subscribe({
      next: (data) => {
        this.saveToken(data.accessToken);
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Google authentication error:', error);
      }
    });
  }

  sendGoogleTokenToBackend(googleToken: string): Observable<any> {
    return this.http.post(`${this.URL}/auth/google/verify`, { token: googleToken });
  }

  renderGoogleButton(elementId: string): void {
    if (typeof window !== 'undefined' && window.google) {
      const isSignUp = elementId.includes('signup');
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: isSignUp ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'es'
        }
      );
    }
  }

  // === Verificación de perfil y navegación por rol =========================
  private checkProfileCompletionAndNavigate(): void {
    const user = this.getLoggedUser();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    // 🚀 Redirección por rol
    if (user.privilege === 'administrador') {
      this.router.navigate(['/Dashboard']);
      return;
    }

    if (user.privilege === 'transportista') {
      this.router.navigate(['/vrp-list']);
      return;
    }

    // 👤 Solo clientes: verificar si completaron perfil
    import('./user.service').then(module => {
      const userService = new module.UserService(this.http, this.router);
      userService.findUserByEmail(user.email).subscribe({
        next: (response) => {
          if (response && response.data) {
            const userData = response.data;
            if (!userService.isProfileComplete(userData)) {
              this.router.navigate(['/UserInformation']);
              return;
            }
          }
          this.router.navigate(['/']);
        },
        error: () => {
          this.router.navigate(['/']);
        }
      });
    }).catch(() => {
      this.router.navigate(['/']);
    });
  }
}
