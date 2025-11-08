import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { CityService } from '../../services/city.service';
import { ProvinceService } from '../../services/province.service';
import { UtilsService } from '../../services/utils.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, AfterViewInit {
  cities: any[] = [];
  provinces: any[] = [];
  selectedProvince: string = '';
  password: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private cityService: CityService,
    private provinceService: ProvinceService,
    private utils: UtilsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.initializeGoogleSignIn();
    this.getProvinces();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.authService.renderGoogleButton('google-signup-button');
    }, 1000);
  }

  getProvinces() {
    this.provinceService.findAll().subscribe({
      next: (data: any[]) => {
        this.provinces = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        console.error('Error fetching provinces', error);
        this.provinces = [];
      },
    });
  }

  getCities() {
    if (this.selectedProvince) {
      this.provinceService
        .findCitiesByProvince(this.selectedProvince)
        .subscribe({
          next: (data: any[]) => {
            this.cities = Array.isArray(data) ? data : [];
          },
          error: (err) => {
            console.error('Error fetching cities', err);
            this.cities = [];
          },
        });
    } else {
      this.cities = [];
    }
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signUp(signUpForm: NgForm) {
    const newUser = signUpForm.value;

    const camposRequeridos = [
      newUser.email,
      newUser.password,
      newUser.firstName,
      newUser.lastName,
      newUser.phone,
      newUser.streetNumber,
      newUser.city,
    ];

    if (!this.utils.areValidFields(camposRequeridos)) {
      this.utils.showAlert(
        'error',
        'Error al registrarse',
        'Debe completar todos los campos obligatorios (*).'
      );
      return;
    }

    if (!this.utils.validateEmail(newUser.email)) {
      this.utils.showAlert(
        'error',
        'Email inválido',
        'Ingrese un email válido.'
      );
      return;
    }

    if (!this.utils.validatePassword(newUser.password)) {
      this.utils.showAlert(
        'error',
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.'
      );
      return;
    }

    if (!this.utils.validatePhone(newUser.phone)) {
      this.utils.showAlert(
        'error',
        'Telefono inválido',
        'Por favor ingrese un telefono válido'
      );
      return;
    }

    if (newUser.password !== newUser.password2) {
      this.utils.showAlert(
        'error',
        'Error en la verificación',
        'Las contraseñas ingresadas no coinciden.'
      );
      return;
    }

    newUser.email = newUser.email.toLowerCase();
    newUser.firstName = this.utils.capitalize(newUser.firstName ?? '');
    newUser.lastName = this.utils.capitalize(newUser.lastName ?? '');

    this.userService.findUserByEmail(newUser.email).subscribe({
      next: (existingUser: any) => {
        if (existingUser === null) {
          newUser.privilege = 'cliente';
          this.userService.signUp(newUser).subscribe({
            next: () => {
              this.utils.showAlert(
                'success',
                'Usuario registrado con éxito!!',
                ''
              );
              this.router.navigate(['/UserRegistration/login']);
            },
            error: (err: any) => {
              console.log(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            },
          });
        } else {
          this.utils.showAlert('error', 'Error', 'El email ya está registrado');
        }
      },
      error: (err: any) => {
        console.log(err);
        this.utils.showAlert(
          'error',
          'Error',
          'Error en la verificación del mail.'
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signUpWithGoogle(): void {
    // Se maneja automáticamente con el botón renderizado
    // La lógica está en AuthService.handleGoogleResponse()
  }
}
