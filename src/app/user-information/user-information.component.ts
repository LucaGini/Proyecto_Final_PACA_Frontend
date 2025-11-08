import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./user-information.component.scss'],
})
export class UserInformationComponent implements OnInit {
  userData: User | any = null;
  isEditMode = false;
  selectedProvince: string = '';

  provinces: any[] = [];
  cities: any[] = [];
  showPassword: boolean = false;

  password: string = '';
  
  // Guardar información completa de provincia y ciudad para mostrar en modo lectura
  currentProvinceInfo: any = null;
  currentCityInfo: any = null;

  // Propiedades para el estado del perfil
  isProfileComplete: boolean = true;
  missingFields: string[] = [];

  constructor(private authService: AuthService, private userService: UserService, private provinceService: ProvinceService, private cityService: CityService, private router: Router, private utils: UtilsService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadProvinces();
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
            if (updatedEmail) {
              localStorage.removeItem('currentUserEmail');
            }
            
            // Verificar estado del perfil
            this.checkProfileCompletion();
            
            // Cargar información completa de ciudad y provincia
            if (this.userData?.city) {
              this.loadCityDetails(this.userData.city);
            }
          } else {
            this.utils.showAlert('error', 'Error', 'Usuario no encontrado');
          }
        },
        error: () => {
          this.utils.showAlert('error', 'Error', 'No se pudieron cargar los datos del usuario');
        },
      });
    }
  }

  loadProvinces(): void {
    this.provinceService.findAll().subscribe({
      next: (response) => {
        this.provinces = Array.isArray(response) ? response : [];
      },
      error: () => {
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las provincias');
      },
    });
  }

  onProvinceChange(event: any): void {
    const provinceId = event.target.value;
    this.userData.city = '';
    if (provinceId) {
      this.provinceService.findCitiesByProvince(provinceId).subscribe({
        next: (response) => {
          this.cities = Array.isArray(response) ? response : [];
        },
        error: () => {
          this.utils.showAlert('error', 'Error', 'No se pudieron cargar las ciudades');
        },
      });
    } else {
      this.cities = [];
    }
  }

  loadCityById(cityId: string): void {
    this.cityService.findCityById(cityId).subscribe({
      next: (response) => {
        if (response.data && response.data.name) {
          this.userData.city = response.data.name;
        }
      },
      error: () => {
        this.userData.city = 'Error al cargar ciudad';
      },
    });
  }

  loadCityDetails(cityId: string): void {
    this.cityService.findCityById(cityId).subscribe({
      next: (response) => {
        if (response.data) {
          this.currentCityInfo = response.data;
          // Cargar información de la provincia si existe
          if (response.data.province) {
            this.currentProvinceInfo = { id: response.data.province };
            // Buscar el nombre de la provincia en la lista cargada
            const province = this.provinces.find(p => p.id === response.data.province);
            if (province) {
              this.currentProvinceInfo = province;
            }
          }
        }
      },
      error: () => {
        console.error('Error al cargar detalles de la ciudad');
      },
    });
  }

  edit(): void {
    this.isEditMode = true;
    this.password = '';
    
    // Configurar los valores para los dropdowns cuando se entra en modo edición
    if (this.currentCityInfo && this.currentProvinceInfo) {
      // Establecer la provincia seleccionada
      this.userData.province = this.currentProvinceInfo.id;
      
      // Cargar las ciudades de esa provincia
      this.provinceService.findCitiesByProvince(this.currentProvinceInfo.id).subscribe({
        next: (response) => {
          this.cities = Array.isArray(response) ? response : [];
          // Establecer la ciudad seleccionada
          this.userData.city = this.currentCityInfo.id;
        },
        error: () => {
          this.utils.showAlert('error', 'Error', 'No se pudieron cargar las ciudades');
        },
      });
    }
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.password = '';
    this.cities = []; // Limpiar las ciudades cargadas
    this.loadUserData();
  }

  saveTemplate(form: any): void {
    if (!form.valid) {
      Object.values(form.controls).forEach((control: any) => control.markAsTouched());
      return;
    }

    if (!this.userData) return;

    const updatedUser: any = {
      id: this.userData.id || this.userData._id,
      email: this.userData.email.toLowerCase(),
      firstName: this.utils.capitalize(this.userData.firstName),
      lastName: this.utils.capitalize(this.userData.lastName),
      phone: this.userData.phone,
      street: this.userData.street,
      streetNumber: String(this.userData.streetNumber),
      city: this.userData.city, // Este ahora es el ID de la ciudad
      ...(this.password ? { password: this.password } : {}),
    };

    if (!this.utils.validateEmail(updatedUser.email)) {
      this.utils.showAlert('error', 'Email inválido', 'Por favor ingrese un email válido');
      return;
    }

    if (!this.utils.validatePhone(updatedUser.phone)) {
      this.utils.showAlert('error', 'Teléfono inválido', 'Por favor ingrese un teléfono válido');
      return;
    }

    if (this.password && !this.utils.validatePassword(this.password)) {
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
        error: () => this.utils.showAlert('error', 'Error', 'Error verificando email'),
      });
    } else {
      this.update(updatedUser);
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
            this.cities = []; // Limpiar las ciudades cargadas
            this.loadUserData(); // Esto también verificará el perfil actualizado
          });
        }
      },
      error: () => this.utils.showAlert('error', 'Error', 'Error al actualizar información'),
    });
  }

  delete(): void {
    if (!this.userData?.email) return;

    this.utils.showConfirm('¿Estás seguro?', 'Esta acción es permanente.').then((result) => {
      if (result.isConfirmed) {
        this.userService.delete(this.userData.id).subscribe({
          next: () => {
            this.authService.logout();
            localStorage.removeItem('accessToken');
            this.utils.showAlert('success', 'Dado de baja', 'Su cuenta fue eliminada').then(() => {
              this.router.navigate(['/UserRegistration']);
            });
          },
          error: () => this.utils.showAlert('error', 'Error', 'Error al eliminar la cuenta'),
        });
      }
    });
  }

  /**
   * Verifica si el perfil del usuario está completo y actualiza las propiedades correspondientes
   */
  private checkProfileCompletion(): void {
    if (this.userData) {
      this.isProfileComplete = this.userService.isProfileComplete(this.userData);
      this.missingFields = this.userService.getMissingProfileFields(this.userData);
    }
  }
}
