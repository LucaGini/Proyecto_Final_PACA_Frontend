import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ProvinceService } from '../services/province.service';
import { CityService } from '../services/city.service';
import { User } from '../services/userInterface';
import { UtilsService } from '../services/utils.service';
import { EditGuardService, EditingComponent } from '../services/edit-guard.service';

@Component({
  selector: 'app-user-information',
  templateUrl: './user-information.component.html',
  styleUrls: ['./user-information.component.scss'],
})
export class UserInformationComponent implements OnInit, OnDestroy, EditingComponent {

  userData: User | any = null;
  originalEmail: string | null = null; // ✅ NUEVO
  isEditMode = false;
  selectedProvince: string = '';

  provinces: any[] = [];
  cities: any[] = [];
  showPassword: boolean = false;

  password: string = '';

  currentProvinceInfo: any = null;
  currentCityInfo: any = null;

  isProfileComplete: boolean = true;
  missingFields: string[] = [];

  componentName = 'user-information';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private provinceService: ProvinceService,
    private cityService: CityService,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit(): void {
    this.editGuardService.registerComponent(this);
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
            this.originalEmail = response.data.email; // ✅ NUEVO

            if (updatedEmail) {
              localStorage.removeItem('currentUserEmail');
            }

            this.checkProfileCompletion();

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

  loadCityDetails(cityId: string): void {
    this.cityService.findCityById(cityId).subscribe({
      next: (response) => {
        if (response.data) {
          this.currentCityInfo = response.data;
          if (response.data.province) {
            const province = this.provinces.find(p => p.id === response.data.province);
            this.currentProvinceInfo = province || { id: response.data.province };
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

    if (this.currentCityInfo && this.currentProvinceInfo) {
      this.userData.province = this.currentProvinceInfo.id;
      this.provinceService.findCitiesByProvince(this.currentProvinceInfo.id).subscribe({
        next: (response) => {
          this.cities = Array.isArray(response) ? response : [];
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
    this.cities = [];
    this.loadUserData();
  }

  saveTemplate(form: any): void {
    if (!form.valid) {
      Object.values(form.controls).forEach((control: any) => control.markAsTouched());
      return;
    }

    const updatedUser: any = {
      id: this.userData.id || this.userData._id,
      email: this.userData.email.toLowerCase(),
      firstName: this.utils.capitalize(this.userData.firstName),
      lastName: this.utils.capitalize(this.userData.lastName),
      phone: this.userData.phone,
      street: this.userData.street,
      streetNumber: String(this.userData.streetNumber),
      city: this.userData.city,
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
      this.utils.showAlert(
        'error',
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, un número y un caracter especial'
      );
      return;
    }

    if (updatedUser.email !== this.originalEmail) { // ✅ CAMBIO CLAVE
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
        if (updatedUser.email !== this.originalEmail) { // ✅ CAMBIO CLAVE
          this.utils.showAlert('success', 'Éxito', 'Email actualizado. Debe iniciar sesión nuevamente').then(() => {
            this.authService.logout();
            this.router.navigate(['/UserRegistration']);
          });
        } else {
          this.utils.showAlert('success', 'Éxito', 'Información actualizada').then(() => {
            this.isEditMode = false;
            this.cities = [];
            this.loadUserData();
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

  private checkProfileCompletion(): void {
    if (this.userData) {
      this.isProfileComplete = this.userService.isProfileComplete(this.userData);
      this.missingFields = this.userService.getMissingProfileFields(this.userData);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.isEditMode;
  }

  async handleUnsavedChanges(): Promise<boolean> {
    return this.utils.showConfirm(
      'Perfil en edición',
      'Estás editando tu información de usuario. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.cancelEdit();
        return true;
      }
      return false;
    });
  }

  ngOnDestroy(): void {
    this.editGuardService.unregisterComponent(this.componentName);
  }
}
