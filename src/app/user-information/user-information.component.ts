import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ProvinceService } from '../services/province.service';
import { CityService } from '../services/city.service';
import { User } from '../services/userInterface';
import { UtilsService } from '../services/utils.service'; 

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
    private fb: FormBuilder,
    private utils: UtilsService 
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProvinces();
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phone: [''],
      street: [''],
      streetNumber: [''],
      province: [''],
      city: [''],
      password: ['', [
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*._-])[A-Za-z\d!@#$%^&*._-]{8,}$/)
      ]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  loadUserData(): void {
    console.log('🔍 Iniciando carga de datos de usuario...');
    const user = this.authService.getLoggedUser();
    const updatedEmail = localStorage.getItem('currentUserEmail');
    const emailToUse = updatedEmail ? updatedEmail : user?.email;

    console.log('👤 Usuario logueado:', user);
    console.log('📧 Email a usar:', emailToUse);

    if (user && emailToUse) {
      this.userService.findUserByEmail(emailToUse).subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servicio:', response);
          if (response && response.data) {
            this.userData = response.data;
            console.log('💾 Datos de usuario cargados:', this.userData);
            if (updatedEmail) {
              localStorage.removeItem('currentUserEmail');
            }

            this.userForm.patchValue({
              ...this.userData,
              id: this.userData?._id,
              password: ''
            });

            if (this.userData?.city) {
              this.loadCityById(this.userData.city);
            }
          } else if (response === null) {
            console.warn('⚠️ Usuario no encontrado con el email:', emailToUse);
            this.handleError('Usuario no encontrado');
          } else {
            console.warn('⚠️ Respuesta inesperada del servicio:', response);
            this.handleError('Error en la respuesta del servicio');
          }
        },
        error: (err) => {
          console.error('❌ Error loading user data:', err);
          this.handleError('Error loading user data');
        }
      });
    } else {
      console.error('❌ No logged in user found - User:', user, 'Email:', emailToUse);
    }
  }

  loadProvinces(): void {
    this.provinceService.findAll().subscribe({
      next: (response) => {
        this.provinces = Array.isArray(response) ? response : [];
      },
      error: (err) => {
        console.error('Error loading provinces:', err);
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
    console.log('🏙️ Cargando ciudad con ID:', cityId);
    this.cityService.findCityById(cityId).subscribe({
      next: (response) => {
        console.log('🏙️ Respuesta del servicio de ciudad:', response);
        if (this.userData && response) {
          // El backend devuelve { message: 'found one city', data: city }
          if (response.data && response.data.name) {
            this.userData.city = response.data.name;
            console.log('✅ Ciudad actualizada:', this.userData.city);
          } else if (response.name) {
            // Por si acaso el backend devuelve directamente el objeto ciudad
            this.userData.city = response.name;
            console.log('✅ Ciudad actualizada (directo):', this.userData.city);
          } else {
            console.warn('⚠️ No se encontró el nombre de la ciudad en la respuesta');
            this.userData.city = 'Ciudad no disponible';
          }
        }
      },
      error: (err) => {
        console.error('❌ Error loading city:', err);
        if (this.userData) {
          this.userData.city = 'Error al cargar ciudad';
        }
        this.handleError('Error loading city');
      }
    });
  }

  save(): void {
    this.utils.markAllControlsAsTouched(this.userForm.controls); // 👈 fuerza validación visual
    if (this.userForm.valid && this.userData) {
      const updatedUser = {
        id: this.userData.id || this.userData._id,
        email: this.userForm.value.email.toLowerCase(),
        firstName: this.utils.capitalize(this.userForm.value.firstName),
        lastName: this.utils.capitalize(this.userForm.value.lastName),
        phone: this.userForm.value.phone,
        street: this.userForm.value.street,
        streetNumber: String(this.userForm.value.streetNumber),
        city: this.userForm.value.city,
        ...(this.userForm.value.password ? { password: this.userForm.value.password } : {})
      };

      if (!this.utils.validateEmail(updatedUser.email)) {
        this.utils.showAlert('error', 'Email inválido', 'Por favor ingrese un email válido');
        return;
      }

      if (!this.utils.validatePhone(updatedUser.phone)) {
        this.utils.showAlert('error', 'Telefono inválido', 'Por favor ingrese un telefono válido');
        return;
      }

      if (updatedUser.password && !this.utils.validatePassword(updatedUser.password)) {
        this.utils.showAlert('error', 'Contraseña inválida', 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, un número y un caracter especial');
        return;
      }

      if (updatedUser.email !== this.userData.email) {
        this.userService.findUserByEmail(updatedUser.email).subscribe({
          next: (existingUser) => {
            if (existingUser) {
              this.utils.showAlert('error', 'Error', 'El email ya está registrado');
            } else {
              this.update(updatedUser);
            }
          },
          error: () => this.handleError('Error verificando email')
        });
      } else {
        this.update(updatedUser);
      }
    }
  }

  private update(updatedUser: any): void {
    this.userService.update(updatedUser).subscribe({
      next: () => {
        if (updatedUser.email !== this.userData?.email) {
          this.authService.updateUserEmail(updatedUser.email);
          this.utils.showAlert('success', 'Éxito', 'Información actualizada').then(() => {
            this.authService.logout();
            this.router.navigate(['/UserRegistration']);
          });
        } else {
          this.utils.showAlert('success', 'Éxito', 'Información actualizada').then(() => {
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

    this.utils.showConfirm('¿Estás seguro?', 'Esta acción es permanente. No podrá volver a loguearse con este mail').then((result) => {
      if (result.isConfirmed) {
        this.userService.delete(this.userData?.id).subscribe({
          next: () => {
            this.authService.logout();
            localStorage.removeItem('accessToken');
            this.utils.showAlert('success', 'Dado de baja!', 'Su cuenta fue eliminada, no podrá volver a usarla en esta página').then(() => {
              this.router.navigate(['/UserRegistration']);
            });
          },
          error: () => this.handleError('Error eliminando la cuenta')
        });
      }
    });
  }

  private handleError(message: string): void {
    console.error(message);
    this.utils.showAlert('error', 'Error', 'Error al intentar guardar cambios. Todos los campos deben estar completos');
  }

  edit(): void {
    this.isEditMode = true;
    if (this.userData) {
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
    this.userForm.reset();
    this.loadUserData();
  }
}
