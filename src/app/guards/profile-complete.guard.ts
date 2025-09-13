import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { UtilsService } from '../services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompleteGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private utils: UtilsService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    
    // Si el usuario no está logueado, permitir acceso normal (otros guards manejarán esto)
    if (!this.authService.isLoggedIn()) {
      return true;
    }

    // Si ya está en la página de User-Information, permitir acceso
    if (state.url === '/UserInformation') {
      return true;
    }

    const user = this.authService.getLoggedUser();
    if (!user) {
      return true;
    }

    // Obtener datos completos del usuario para verificar su perfil
    return this.userService.findUserByEmail(user.email).pipe(
      map(response => {
        if (response && response.data) {
          const userData = response.data;
          
          // Verificar si el perfil está completo
          if (!this.userService.isProfileComplete(userData)) {
            const missingFields = this.userService.getMissingProfileFields(userData);
            
            // Mostrar mensaje informativo al usuario
            this.utils.showAlert(
              'info', 
              'Perfil Incompleto', 
              `Para continuar, debe completar los siguientes campos: ${missingFields.join(', ')}`
            );
            
            // Redirigir a User-Information
            return this.router.parseUrl('/UserInformation');
          }
        }
        
        // El perfil está completo, permitir acceso
        return true;
      })
    );
  }
}