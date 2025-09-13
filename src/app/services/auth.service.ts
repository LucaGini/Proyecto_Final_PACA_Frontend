import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'
import { environment } from 'src/environments/environment';

type DecodeUserPayload = {
  email: string,
  privilege: string
  iat: number
  exp: number
}

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
  private tokenKey = 'access_token'

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkToken());
  private isAdminInSubject = new BehaviorSubject<boolean>(this.checkAdmin());

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

  isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  isAdmin$(): Observable<boolean> {
    return this.isAdminInSubject.asObservable();
  }

  private checkToken(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  }
  private checkAdmin(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!!!token) return false

    try {
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      return decodedToken.privilege === 'administrador'
    } catch (err) {
      return false
    }
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  isAdmin(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try{
      const decodedToken = jwtDecode(token) as DecodeUserPayload;
      return decodedToken.privilege === 'administrador';
    }catch (err) {
      return false;
    }
  }

  getLoggedUser(): DecodeUserPayload | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;

    try{
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
    this.checkAdmin();
    
    // Verificar si el perfil está completo antes de navegar
    this.checkProfileCompletionAndNavigate();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
    this.isAdminInSubject.next(false);
    this.router.navigate(['/UserRegistration']);
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
  return this.http.post<any>(url, { email, password, captchaToken  }, { headers: this.getAuthHeaders() }).pipe(
    catchError((err) => {
      console.error('Error en el servicio:', err);
      return throwError(() => err); 
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

      
      localStorage.setItem('currentUserEmail', newEmail);
    } catch (error) {
      console.error('Token update failed:', error);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

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

  private checkProfileCompletionAndNavigate(): void {
    const user = this.getLoggedUser();
    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    // Solo verificar perfil para usuarios clientes (no administradores)
    if (user.privilege === 'administrador') {
      this.router.navigate(['/']);
      return;
    }

    // Importar UserService dinámicamente para evitar dependencia circular
    import('./user.service').then(module => {
      const userService = new module.UserService(
        this.http, 
        this.router
      );

      userService.findUserByEmail(user.email).subscribe({
        next: (response) => {
          if (response && response.data) {
            const userData = response.data;
            
            // Si el perfil no está completo, redirigir a User-Information
            if (!userService.isProfileComplete(userData)) {
              this.router.navigate(['/UserInformation']);
              return;
            }
          }
          
          // Perfil completo o no se pudo verificar, ir al home
          this.router.navigate(['/']);
        },
        error: () => {
          // Error al verificar perfil, ir al home por defecto
          this.router.navigate(['/']);
        }
      });
    }).catch(() => {
      // Error al cargar UserService, ir al home por defecto
      this.router.navigate(['/']);
    });
  }
}

