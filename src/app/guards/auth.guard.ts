import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; 
import { Observable } from 'rxjs';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private utils: UtilsService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    
    const isLoggedIn = this.authService.isLoggedIn();
    const user = this.authService.getLoggedUser();
    const userRole = user?.privilege || '';
    const allowedRoles = route.data['roles'] as string[] | undefined;
    const excludeRoles = route.data['excludeRoles'] as string[] | undefined;

    // --- SOLO USUARIOS NO LOGUEADOS ---
    if (route.data['onlyGuest']) {
      if (isLoggedIn) {
        this.denyAccess('Solo usuarios no logueados pueden acceder a esta sección.');
        return this.safeRedirect(state);
      }
      return true;
    }

    // --- USUARIOS NO LOGUEADOS ---
    if (!isLoggedIn) {
      if (allowedRoles) {
        this.denyAccess('Debés iniciar sesión para acceder a esta sección.');
        return this.safeRedirect(state);
      }
      return true;
    }

    // --- ROLES NO PERMITIDOS ---
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      this.denyAccess('No tiene permiso para acceder a esta sección.');
      return this.safeRedirect(state);
    }

    if (excludeRoles && excludeRoles.includes(userRole)) {
      this.denyAccess('No tiene permiso para acceder a esta sección.');
      return this.safeRedirect(state);
    }

    return true;
  }

  private denyAccess(reason: string): void {
    this.utils.showTimedInfo('Acceso denegado', reason);
  }

  /** Redirige de forma segura evitando bucles infinitos */
  private safeRedirect(state: RouterStateSnapshot): UrlTree {
    // Si ya estás en /about-us, no redirige de nuevo
    if (state.url === '/about-us') {
      return this.router.parseUrl('/about-us');
    }
    return this.router.parseUrl('/about-us');
  }
}
