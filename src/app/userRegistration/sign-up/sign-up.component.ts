import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { CityService } from '../../services/city.service';
import { ProvinceService } from '../../services/province.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})

export class SignUpComponent {
  cities: any[] = [];
  provinces: any[] = [];
  selectedProvince: string = '';	
  password: string = '';
  showPassword: boolean = false;
  
  constructor(
  private router: Router,
  private userService: UserService,
  private cityService: CityService,
  private provinceService :ProvinceService,
  ) {}
  
ngOnInit(): void {
  this.getCities();
  this.getProvinces();
}

getProvinces() {
  this.provinceService.findAll().subscribe({
    next: (data: any[]) => {
      this.provinces = Array.isArray(data) ? data : [];
    },
    error: (error) => {
      console.error('Error fetching provinces', error);
      this.provinces = [];
    }
  });
}

getCities() {
  if (this.selectedProvince) {
    this.provinceService.findCitiesByProvince(this.selectedProvince).subscribe({
      next: (data: any[]) => {
        this.cities = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Error fetching cities', err);
        this.cities = [];
      }
    });
  } else {
    this.cities = [];
  }
}

signUp(signUpForm: NgForm) {  
  const newUser = signUpForm.value;
if ( !newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName || !newUser.phone || !newUser.city ){
  Swal.fire({
    icon: 'error',
    title: 'Error al registrarse',
    text: 'Debe completar todos los campos obligatorios (*).',});}
else if (!this.validatePassword(newUser.password)) {
    Swal.fire({
      icon: 'error',
      title: 'Contraseña inválida',
      text: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial.',
    });
  } else {
    newUser.email = newUser.email.toLowerCase();
    this.userService.findUserByEmail(newUser.email)
    .subscribe(
      (existingUser: any) => {
      if (existingUser === null) {
        newUser.privilege = "cliente";
        this.userService.signUp(newUser).subscribe(
        (response: any) => {
        console.log(response);
        Swal.fire(
          'Usuario registrado con éxito!!',
          '',
          'success'
        );
        this.router.navigate(['/UserRegistration/login']);
        },
        (err: any) => {
        console.log(err);
        Swal.fire({
          icon: 'error',
          title: 'Registro fallido',
          text: err.message,
          });
        }
        );
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El email ya está registrado',
          });
        }
      },
      (err: any) => {
      console.log(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error en la verificación del mail.',
      });
    }
    );
  }
  }

  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/;
    return regex.test(password);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}