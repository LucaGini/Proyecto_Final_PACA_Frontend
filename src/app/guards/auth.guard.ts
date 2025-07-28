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

    // No logueados
    if (route.data['onlyGuest']) {
      if (isLoggedIn) {
        this.denyAccess('Solo usuarios no logueados pueden acceder a esta sección.');
        return this.router.parseUrl('/');
      }
      return true;
    }

    // Logueados
    if (!isLoggedIn) {
      if (allowedRoles) {
        this.denyAccess('Debés iniciar sesión para acceder a esta sección.');
        return this.router.parseUrl('/');
      }
      if (excludeRoles) {
        return true;
      }
    }

    // No está logueado pero no hay restriccion 
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      this.denyAccess('No tiene permiso para acceder a esta sección.');
      return this.router.parseUrl('/');
    }

    // El rol tiene acceso
    if (excludeRoles && excludeRoles.includes(userRole)) {
      this.denyAccess('No tiene permiso para acceder a esta sección.');
      return this.router.parseUrl('/');
    }

    return true;
  }

  private denyAccess(reason: string): void {
    this.utils.showTimedInfo('Acceso denegado', reason);
  }
}
    

  
