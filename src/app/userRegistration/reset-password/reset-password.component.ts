import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})

export class ResetPasswordComponent {

  resetForm = this.formbuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private formbuilder: FormBuilder,
    private loginService: LoginService,
    private userService: UserService)
    {}

    get email(){
      return this.resetForm.controls.email;
    }
  
VerifyEmail() {
  if (this.resetForm.valid) {
    const email = this.email.value?.toLowerCase();

    if (email) {
      this.userService.findUserByEmail(email).subscribe({
        
        next: (existingUser: any) => {
          if (existingUser != null) {
            this.authService.sendResetPasswordEmail(email).subscribe({
              next: () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Correo enviado',
                  text: 'Por favor revise su correo para restablecer su contraseña.',
                });
                localStorage.setItem('userEmail', email);
              },
              error: (error: any) => {
                console.error('Error al enviar el correo', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error al enviar el correo',
                  text: 'No se pudo enviar el correo. Intente nuevamente.',
                });
              }
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error en la verificación',
              text: 'Su mail no fue encontrado.',
            });
          }
        },
        error: (error: any) => {
          console.error('Error al verificar el email', error);
          Swal.fire({
            icon: 'error',
            title: 'Error en la verificación',
            text: 'No se pudo encontrar su mail. Intente nuevamente.',
          });
        }
      });
    }
  } else {
    this.resetForm.markAllAsTouched();
  }
}
}