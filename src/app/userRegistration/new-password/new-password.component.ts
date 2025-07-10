import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from "@angular/router";
import { FormBuilder, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service'; // ✅ agregado

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {
  userEmail: string = ''; 
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  resetPasswordForm = this.formbuilder.group({
    password: ['', [Validators.required]],
    password2: ['', [Validators.required]]
  });

  constructor(
    private userService: UserService,
    private router: Router,
    private formbuilder: FormBuilder,
    private utils: UtilsService 
  ) {}

  get password() { return this.resetPasswordForm.controls.password; }
  get password2() { return this.resetPasswordForm.controls.password2; }

  ngOnInit(): void {
    const storedEmail = localStorage.getItem('userEmail');
    this.userEmail = storedEmail !== null ? storedEmail : '';
    localStorage.removeItem('userEmail');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ResetPassword() {
    if (this.resetPasswordForm.valid) {
      const password = this.password.value || '';
      const password2 = this.password2.value || '';

      if (password !== password2) {
        this.utils.showAlert('error', 'Error en la verificación', 'Por favor ingrese la misma contraseña dos veces.');
        return;
      }

      if (!this.utils.validatePassword(password)) {
        this.utils.showAlert( 'error', 'Contraseña inválida', 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.'
        );
        return;
      }

      this.userService.updatePassword(this.userEmail, password).subscribe({
        next: () => {
          this.utils.showAlert('success', 'Contraseña actualizada', 'Su contraseña ha sido actualizada correctamente.');
          this.router.navigate(['/UserRegistration']);
        },
        error: (error: any) => {
          console.error('Error al actualizar contraseña:', error);
          this.utils.showAlert('error', 'Error al actualizar contraseña', 'No se pudo actualizar la contraseña. Intente nuevamente.');
        }
      });
    } else {
      this.utils.markAllControlsAsTouched(this.resetPasswordForm.controls); 
      this.utils.showAlert('error', 'Campos incompletos', 'Por favor completá todos los campos.');
    }
  }
}
