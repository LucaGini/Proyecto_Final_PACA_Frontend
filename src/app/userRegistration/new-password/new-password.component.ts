import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss'],
})
export class NewPasswordComponent implements OnInit {
  userEmail: string = '';
  showPassword = false;
  showConfirmPassword = false;

  passwordValue: string = '';
  password2Value: string = '';

  constructor(private userService: UserService, private router: Router, private utils: UtilsService) {}

  ngOnInit(): void {
    const storedEmail = localStorage.getItem('userEmail');
    this.userEmail = storedEmail || '';
    localStorage.removeItem('userEmail');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ResetPassword(form: any) {
    if (form.valid) {
      const password = this.passwordValue;
      const password2 = this.password2Value;

      if (password !== password2) {
        this.utils.showAlert('error', 'Error en la verificación', 'Las contraseñas ingresadas no coinciden.');
        return;
      }

      if (!this.utils.validatePassword(password)) {
        this.utils.showAlert('error', 'Contraseña inválida', 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.');
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
        },
      });
    } else {
      this.utils.showAlert('error', 'Campos incompletos', 'Por favor completá todos los campos.');
    }
  }
}
