import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginError: string = '';
  isPasswordIncorrect: boolean = false;
  showPassword: boolean = false;

  loginForm = this.formbuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private formbuilder: FormBuilder,
    private loginService: LoginService,
    private utils: UtilsService
  ) {}

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  login() {
    if (this.loginForm.valid) {
      const email = this.email.value?.toLowerCase() || '';
      const password = this.password.value || '';

      if (!this.utils.validateEmail(email)) {
        this.utils.showAlert('error', 'Email inválido', 'Por favor ingrese un email válido.');
        return;
      }

      this.authService.sendRequestToLogin(email, password).subscribe({
        next: (data) => {
          this.authService.saveToken(data.accessToken);
          this.isPasswordIncorrect = false;
          this.loginError = '';
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isPasswordIncorrect = true;
          this.loginError = error?.message || 'Contraseña incorrecta';
          this.utils.showAlert('error', 'Error', 'Usuario no encontrado.');
        }
      });
    } else {
      this.utils.markAllControlsAsTouched(this.loginForm.controls);
      this.utils.showAlert( 'error', 'Campos incompletos', 'Por favor completá todos los campos requeridos.'
      );
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
