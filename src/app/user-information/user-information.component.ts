import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ProvinceService } from '../services/province.service';
import { CityService } from '../services/city.service';
import { User } from '../services/userInterface.js';

@Component({
  selector: 'app-user-information',
  templateUrl: './user-information.component.html',
  styleUrls: ['./user-information.component.scss']
})
export class UserInformationComponent implements OnInit {
  userData: User | null = null;
  userForm!: FormGroup;
  isEditMode = false;
  provinces: any[] = [];
  cities: any[] = [];
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private provinceService: ProvinceService,
    private cityService: CityService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProvinces();
    this.initForm();
    }

  private initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      firstName: [''],
      lastName: [''],
      phone: [''],
      street: [''],
      streetNumber: [''],
      province: [''],
      city: [''],
      password: ['',[
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/)
      ]]
    });
  }

  validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/;
    return regex.test(password);
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loadUserData(): void {
    const user = this.authService.getLoggedUser();
    const updatedEmail = localStorage.getItem('currentUserEmail');
    const emailToUse = updatedEmail ? updatedEmail : user?.email;
  
    if (user && emailToUse) {
      this.userService.findUserByEmail(emailToUse).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.userData = response.data;
            if (updatedEmail){
              localStorage.removeItem('currentUserEmail');
            }

            this.userForm.patchValue({
              ...this.userData,
              id: this.userData?._id,
              password: ''
          });
          }

          if (this.userData?.city){
            this.loadCityById(this.userData.city);
          }
        },
        error: (err) => {
          console.error('Error loading user data:', err);
          this.handleError('Error loading user data');
        }
      });
    } else {
      console.error('No logged in user found');
    }
  }

  
  loadProvinces(): void {
    this.provinceService.findAll().subscribe({
      next: (response) => {
        this.provinces = Array.isArray(response) ? response : [];
      },
      error: (err) => {
        console.error('Error loading provinces:', err); // Debugging log
        this.handleError('Error loading provinces');
      }
    });
  }

  onProvinceChange(event: any): void {
    const provinceId = event.target.value;
    if (provinceId) {
      this.provinceService.findCitiesByProvince(provinceId).subscribe({
        next: (response) => {
          this.cities = Array.isArray(response) ? response : [];
        },
        error: (err) => {
          console.error('Error loading cities:', err);
          this.handleError('Error loading cities');
        }
      });
    } else {
      console.error('No province selected'); 
    }
  }

loadCityById(cityId: string): void {
  this.cityService.findCityById(cityId).subscribe({
    next: (data) => {
      if (this.userData) {
        // Check the structure of the data object
        if (data && data.name) {
          this.userData.city = data.name;
        } else if (data && data.data && data.data.name) {
          this.userData.city = data.data.name;
        } else {
          console.error('City name not found in the response data');
        }
      }
    },
    error: (err) => {
      console.error('Error loading city:', err); 
      this.handleError('Error loading city');
    }
  });
}

save(): void {
  if (this.userForm.valid && this.userData) {
    const updatedUser = {
      id: this.userData.id || this.userData._id,
      email: this.userForm.value.email.toLowerCase(),
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName, 
      phone: this.userForm.value.phone,
      street: this.userForm.value.street,
      streetNumber: String(this.userForm.value.streetNumber),
      city: this.userForm.value.city,
      ...(this.userForm.value.password ? { password: this.userForm.value.password } : {})
    };

    // Check email format
    if (!this.userForm.get('email')?.valid) {
      Swal.fire({
        icon: 'error',
        title: 'Email inválido',
        text: 'Por favor ingrese un email válido'
      });
      return;
    }

    // Check password if provided
    if (updatedUser.password && !this.validatePassword(updatedUser.password)) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña inválida',
        text: 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, un número y un caracter especial',
      });
      return;
    }

    // Check if email changed and verify not in use
    if (updatedUser.email !== this.userData.email) {
      this.userService.findUserByEmail(updatedUser.email).subscribe({
        next: (existingUser) => {
          if (existingUser) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'El email ya está registrado'
            });
          } else {
            this.update(updatedUser);
          }
        },
        error: (err) => this.handleError('Error verificando email')
      });
    } else {
      this.update(updatedUser);
    }
  }
}

private update(updatedUser: any): void {
  this.userService.update(updatedUser).subscribe({
    next: (response) => {
      if (updatedUser.email !== this.userData?.email) {
        // Update auth service first
        this.authService.updateUserEmail(updatedUser.email);
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Información actualizada'
        }).then(() => {
          // Force new login with updated email
          this.authService.logout();
          this.router.navigate(['/UserRegistration']);
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Información actualizada'
        }).then(() => {
          this.isEditMode = false;
          this.loadUserData();
        });
      }
    },
    error: (err) => {
      console.error('Update error:', err);
      this.handleError('Error updating information');
    }
  });
}

  delete(): void {
    if (!this.userData?.email) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Está acción es permanente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e7c633',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Confirmar baja'
    }).then((result) => {
      if (result.isConfirmed) {
          this.userService.delete(this.userData?.id).subscribe({
          next: () => {
            this.authService.logout();
            localStorage.removeItem('accessToken');
            Swal.fire({
              title: 'Dado de baja!',
              text: 'Cuenta eliminada exitosamente',
              icon: 'success'
          }).then(() => {
            this.router.navigate(['/UserRegistration']);
          });
          },
          error: (err) => this.handleError('Error eliminando la cuenta')
        });
      }
    });
  }

  private handleError(message: string): void {
    console.error(message);
    Swal.fire('Error', 'Error al intentar guardar cambios. Todos los campos deben estar completos', 'error');
  }

  edit(): void {
    this.isEditMode = true;
    //Reset form with user data, explicitly setting password to empty
    if (this.userData){
      this.userForm.patchValue({
        email: this.userData.email,
        firstName: this.userData.firstName,
        lastName: this.userData.lastName,
        phone: this.userData.phone,
        street: this.userData.street,
        streetNumber: this.userData.streetNumber,
        city: this.userData.city,
        password: ''
      });
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    //Reset form completely
    this.userForm.reset();
    this.loadUserData();
  }
}