import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, Validators } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { LoginRequest } from '../../services/loginRequest';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginError: string = '';
  isPasswordIncorrect: boolean = false; // Nueva variable para manejar el error de contraseña incorrecta
  showPassword: boolean = false;

  loginForm = this.formbuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private formbuilder: FormBuilder,
    private loginService: LoginService
  ) {}

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  login() {
    if (this.loginForm.valid) {
      this.authService
        .sendRequestToLogin(
          this.email.value as string,
          this.password.value as string
        )
        .subscribe(
          (data) => {
            this.authService.saveToken(data.accessToken);// ACA GUARDAMOS LA INFORMACION DEL TOKEN 
            this.isPasswordIncorrect = false; // Resetea el error si el login es exitoso
            this.loginError = '';
            this.router.navigate(['/']); // Redirige al usuario si es exitoso
          },
(error) => {
            this.isPasswordIncorrect = true;
            this.loginError = error?.message || 'Contraseña incorrecta';
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Usuario no encontrado.',
        });
          }
        );
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}