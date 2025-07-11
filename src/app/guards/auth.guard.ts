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

    // solo los que no están logueados pueden acceder a las rutas con onlyGuest
    if (route.data['onlyGuest']) {
      if (isLoggedIn) {
        this.denyAccess('Esta página solo está disponible para usuarios no registrados.');
        return this.router.parseUrl('/');
      }
      return true;
    }

    // Caso modificado para permitir invitados si solo hay excludeRoles
    if (!isLoggedIn) {
      if (allowedRoles) {
        this.denyAccess('Debés iniciar sesión para acceder a esta página.');
        return this.router.parseUrl('/');
      }
      if (excludeRoles) {
        return true;
      }
    }

    // Si el usuario no está logueado y no hay roles permitidos o excluidos, se permite el acceso
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      this.denyAccess('Tu rol no tiene permiso para acceder a esta sección.');
      return this.router.parseUrl('/');
    }

    // Si el usuario tiene un rol excluido, se le quita el acceso
    if (excludeRoles && excludeRoles.includes(userRole)) {
      this.denyAccess('Esta página no está disponible para tu tipo de usuario.');
      return this.router.parseUrl('/');
    }

    return true;
  }

  private denyAccess(reason: string): void {
    this.utils.showTimedInfo('Acceso denegado', reason);
  }
}
    

  
