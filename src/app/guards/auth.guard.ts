import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> {
    
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return false;
    }
  
    const user = this.authService.getLoggedUser();
    const userRole = user?.privilege || '';
    const allowedRoles = route.data['roles'] as string[];

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }  
}
