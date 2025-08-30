import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginService } from '../../services/login.service';
import { UtilsService } from '../../services/utils.service';
import { NgForm } from '@angular/forms';
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

  email: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService, private loginService: LoginService, private utils: UtilsService) {}

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  login(form: NgForm) {
    if (!this.captchaToken) {
      this.utils.showAlert('error', 'Error', 'Por favor completa el captcha.');
      return;
    }

    if (form.valid) {
      const email = this.email.toLowerCase();
      const password = this.password;

      if (!this.utils.validateEmail(email)) {
        this.utils.showAlert('error', 'Email inválido', 'Por favor ingrese un email válido.');
        return;
      }

      this.authService.sendRequestToLogin(email, password, this.captchaToken).subscribe({
        next: (data) => {
          this.authService.saveToken(data.accessToken);
          this.isPasswordIncorrect = false;
          this.loginError = '';
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isPasswordIncorrect = true;
          const msg = error?.error?.message || error?.message || 'Usuario no encontrado';

          switch (msg) {
            case 'Usuario desactivado':
              this.loginError = 'Usuario dado de baja';
              this.utils.showAlert('error', 'Error', 'Usuario dado de baja');
              break;
            case 'Credenciales inválidas':
              this.loginError = 'Contraseña incorrecta';
              this.utils.showAlert('error', 'Error', 'La contraseña es incorrecta');
              break;
            case 'Invalid user':
              this.loginError = 'Usuario no encontrado';
              this.utils.showAlert('error', 'Error', 'Usuario no registrado');
              break;
            default:
              this.loginError = msg;
              this.utils.showAlert('error', 'Error', msg);
          }

          if (this.captchaRef) {
            this.captchaRef.reset();
          }
          this.captchaToken = null;
        },
      });
    } else {
      this.utils.showAlert('error', 'Campos incompletos', 'Por favor completá todos los campos requeridos.');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
