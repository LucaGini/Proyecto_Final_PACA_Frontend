import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ProvinceService } from '../../services/province.service';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-driver',
  templateUrl: './add-driver.component.html',
  styleUrls: ['./add-driver.component.scss']
})
export class DriverComponent implements OnInit {
  provinces: any[] = [];
  selectedProvince: string = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private provinceService: ProvinceService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getProvinces();
  }

  getProvinces() {
    this.provinceService.findAll().subscribe({
      next: (data: any[]) => this.provinces = data,
      error: (error) => console.error('Error fetching provinces', error),
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signUp(signUpForm: NgForm) {
    const newUser = signUpForm.value;

    // Data formatting
    newUser.email = newUser.email.toLowerCase();
    newUser.firstName = this.utils.capitalize(newUser.firstName);
    newUser.lastName = this.utils.capitalize(newUser.lastName);
    newUser.privilege = 'transportista';
    newUser.province = this.selectedProvince;


    if (newUser.password !== newUser.password2) {
      this.utils.showAlert('error', 'Error', 'Las contraseñas no coinciden');
      return;
    }

    this.userService.findUserByEmail(newUser.email).subscribe({
      next: (existingUser) => {
        if (existingUser) {
          this.utils.showAlert('error', 'Error', 'El email ya está registrado');
          return;
        }

        console.log('Creating user:', newUser);
        this.userService.signUp(newUser).subscribe({
          next: () => {
            this.utils.showAlert('success', 'Transportista creado con éxito', '');
            signUpForm.resetForm();
          },
          error: (err) => {
            console.error(err);
            this.utils.showAlert('error', 'Error', err.message);
          }
        });
      },
      error: () => {
        this.utils.showAlert('error', 'Error', 'No se pudo verificar el email');
      }
    });
  }
}
