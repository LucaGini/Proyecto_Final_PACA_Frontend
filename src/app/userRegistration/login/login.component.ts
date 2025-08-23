import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { UtilsService } from '../../services/utils.service';

import { RecaptchaComponent } from 'ng-recaptcha';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    @ViewChild('captchaRef') captchaRef!: RecaptchaComponent;

  captchaToken: string | null = null;

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

  onCaptchaResolved(token: string | null) {
    if (token) {
      this.captchaToken = token;
    } else {
      this.captchaToken = null;
    }
  }

login() {
  if (!this.captchaToken) {
    this.utils.showAlert('error', 'Error', 'Por favor completa el captcha.');
    return;
  }

  if (this.loginForm.valid) {
    const email = this.email.value?.toLowerCase() || '';
    const password = this.password.value || '';

    if (!this.utils.validateEmail(email)) {
      this.utils.showAlert('error', 'Email inválido', 'Por favor ingrese un email válido.');
      return;
    }

    this.authService
      .sendRequestToLogin(email, password, this.captchaToken!)
      .subscribe({
        next: (data) => {
          this.authService.saveToken(data.accessToken);
          this.isPasswordIncorrect = false;
          this.loginError = '';
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isPasswordIncorrect = true;

          const msg = error?.error?.message || error?.message || 'Usuario no encontrado';

          if (msg === 'Usuario desactivado') {
            this.loginError = 'Usuario dado de baja';
            this.utils.showAlert('error', 'Error', 'Usuario dado de baja');
          } else if (msg === 'Credenciales inválidas') {
            this.loginError = 'Contraseña incorrecta';
            this.utils.showAlert('error', 'Error', 'La contraseña es incorrecta');
            } else if (msg === 'Invalid user') {
            this.loginError = 'Usuario no encontrado';
            this.utils.showAlert('error', 'Error', 'Usuario no registrado');
          } else {
            this.loginError = msg;
            this.utils.showAlert('error', 'Error', msg);
          }

          // Reset captcha
          if (this.captchaRef) {
            this.captchaRef.reset();
          }
          this.captchaToken = null;
        },
      });
  } else {
    this.utils.markAllControlsAsTouched(this.loginForm.controls);
    this.utils.showAlert(
      'error',
      'Campos incompletos',
      'Por favor completá todos los campos requeridos.'
    );
  }
}
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
