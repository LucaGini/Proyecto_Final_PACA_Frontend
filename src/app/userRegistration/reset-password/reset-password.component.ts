import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private utils: UtilsService
  ) {}

  verifyEmail(form: any) {
    if (form.valid) {
      const email = form.value.email?.toLowerCase();

      if (!this.utils.validateEmail(email || '')) {
        this.utils.showAlert('error', 'Email inválido', 'Ingrese un email válido.');
        return;
      }

      this.userService.findUserByEmail(email!).subscribe({
        next: (existingUser: any) => {
          if (existingUser != null) {
            this.authService.sendResetPasswordEmail(email!).subscribe({
              next: () => {
                this.utils.showAlert('success', 'Correo enviado', 'Por favor revise su correo para restablecer su contraseña.');
                localStorage.setItem('userEmail', email!);
              },
              error: (error: any) => {
                console.error('Error al enviar el correo', error);
                this.utils.showAlert('error', 'Error al enviar el correo', 'No se pudo enviar el correo. Intente nuevamente.');
              }
            });
          } else {
            this.utils.showAlert('error', 'Error en la verificación', 'Su mail no fue encontrado.');
          }
        },
        error: (error: any) => {
          console.error('Error al verificar el email', error);
          this.utils.showAlert('error', 'Error en la verificación', 'No se pudo encontrar su mail. Intente nuevamente.');
        }
      });
    } else {
      Object.values(form.controls).forEach((control: any) => control.markAsTouched());
      this.utils.showAlert('error', 'Campo incompleto', 'Por favor ingrese un email válido.');
    }
  }
}
