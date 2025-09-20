import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { CityService } from 'src/app/services/city.service';
import { ProvinceService } from 'src/app/services/province.service';
import { FilterCitiesProvinceService } from 'src/app/services/filters/filter-cities-province.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EditGuardService, EditingComponent } from 'src/app/services/edit-guard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-list-cities',
  templateUrl: './edit-list-cities.component.html',
  styleUrls: ['./edit-list-cities.component.scss']
})
export class EditListCitiesComponent implements OnDestroy, EditingComponent {

  cities: any[] = [];
  provinces: any[] = [];
  selectedProvinceId: string = '';

  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'edit-list-cities';

  constructor(
    private cityService: CityService,
    private provinceService: ProvinceService,
    private filterCitiesProvinceService: FilterCitiesProvinceService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    this.getProvinces();
    this.cityService.cities$.subscribe((data: any) => {
      this.cities = data;
    });

    this.filterCitiesProvinceService.provinceSelected$.subscribe(async (provinceId: string) => {
      await this.provinceService.findCitiesByProvince(provinceId).subscribe((data: any) => {
        this.cities = data;
      });
    });
    
    // Listener para advertir al usuario antes de cerrar/recargar la página si hay ediciones pendientes
    window.addEventListener('beforeunload', this.beforeUnloadHandler.bind(this));
    
    // Interceptar navegación dentro de la SPA
    this.setupNavigationGuard();
  }

  ngOnDestroy() {
    // Desregistrar este componente del servicio de guardia
    this.editGuardService.unregisterComponent(this.componentName);
    
    // Limpiar el listener cuando el componente se destruya
    window.removeEventListener('beforeunload', this.beforeUnloadHandler.bind(this));
    // Limpiar suscripción del router
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private beforeUnloadHandler(event: BeforeUnloadEvent): void {
    if (this.hasCitiesInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes ciudades en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasCitiesInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Ciudad en edición',
            'Estás editando una ciudad. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
          ).then((result) => {
            if (result.isConfirmed) {
              // Cancelar todas las ediciones
              this.cancelAllEdits();
              // Permitir la navegación
              this.allowNavigation = true;
              // Navegar a la URL que el usuario quería
              this.router.navigateByUrl(event.url).then(() => {
                // Resetear la bandera después de la navegación exitosa
                this.allowNavigation = false;
              });
            }
          });
        }
      }
    });
  }

  delete(city: any): void {
    this.cityService.findUsersByCity(city.postCode)
      .subscribe(
        (foundUsers: any) => {
          if (foundUsers.data && foundUsers.data.length === 0) {
            this.utils.showConfirm('Desea eliminar la ciudad', 'Esta acción no se puede deshacer')
              .then((result) => {
                if (result.isConfirmed) {
                  this.cityService.delete(city.id).subscribe({
                    next: res => {
                      this.utils.showAlert('success', 'Confirmado', 'La acción ha sido confirmada');
                      this.cities = this.cities.filter(c => c.id !== city.id);
                    },
                    error: err => {
                      console.log(err);
                      this.utils.showAlert('error', 'Error', 'No se pudo eliminar la ciudad.');
                    }
                  });
                }
              });
          } else {
            this.utils.showAlert('error', 'Error', 'No se puede eliminar la ciudad, ya que tiene usuarios asociados.');
          }
        },
        error => {
          console.log(error);
          this.utils.showAlert('error', 'Error', 'Error al verificar usuarios asociados.');
        }
      );
  }

  edit(city: any): void {
    // Verificar si ya hay alguna ciudad en edición
    if (this.hasCitiesInEditMode()) {
      this.utils.showAlert('warning', 'Ciudad en edición', 'Ya tienes una ciudad en modo edición. Debes guardar o cancelar los cambios antes de editar otra ciudad.');
      return;
    }

    city.editName = city.name;
    city.editPostCode = (city.postCode ?? '').toUpperCase();
    city.editSurcharge = city.surcharge;
    city.editing = true;
  }

  cancelEdit(city: any): void {
    city.editing = false;
  }

  save(city: any): void {
    const original = {
      name: city.name,
      postCode: city.postCode,
      surcharge: city.surcharge
    };

    const updated = {
      name: city.editName,
      postCode: city.editPostCode,
      surcharge: city.editSurcharge
    };

    if (!updated.name || !updated.postCode || updated.surcharge == null) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
      return;
    } 

    // Validar longitud del código postal
    if (updated.postCode.length < 8 || updated.postCode.length > 10) {
      this.utils.showAlert('error', 'Error en el código postal', 'El código postal debe tener entre 8 y 10 caracteres.');
      return;
    }

    // Validar que el código postal sea solo alfanumérico
    const alphanumericRegex = /^[A-Z0-9]+$/;
    if (!alphanumericRegex.test(updated.postCode)) {
      this.utils.showAlert('error', 'Error en el código postal', 'El código postal solo puede contener letras y números.');
      return;
    }

    if (this.utils.hasObjectChanged(original, updated)) {
      updated.name = this.utils.capitalize(updated.name ?? '');
      updated.postCode = (updated.postCode ?? '').toUpperCase();

      this.cityService.findCityByPostCode(updated.postCode)
        .subscribe({
          next: (existingCity: any) => {
            if (existingCity === null || city.postCode === updated.postCode) {
              this.utils.copyProperties(city, updated);

              this.cityService.update(city).subscribe({
                next: (response: any) => {
                  this.utils.showAlert('success', 'Ciudad registrada con éxito!!');
                  city.editing = false;
                },
                error: (err: any) => {
                  console.log(err);
                  this.utils.showAlert('error', 'Registro fallido', err.message);
                }
              });
            } else {
              this.utils.showAlert('error', 'Error', 'El código postal ya está registrado');
            }
          },
          error: (err: any) => {
            console.log(err);
            this.utils.showAlert('error', 'Error', 'Error en la verificación del código postal.');
          }
        });
    } else {
      this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en la ciudad.');
      city.editing = false;
    }
  }

  getProvinces() {
    this.provinceService.findAll().subscribe({
      next: (data: any) => {
        this.provinces = data;
      },
      error: (error) => {
        console.error('Error al obtener provincias', error);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las provincias.');
      }
    });
  }

  onProvinceButtonClick(provinceId: string) {
    this.filterCitiesProvinceService.emitProvinceSelected(provinceId);
  }

  onProvinceChange(event: any) {
    const selectedProvince = event.target.value;
    this.selectedProvinceId = selectedProvince === "" ? '' : selectedProvince;
    
    if (selectedProvince === "") {
      this.cityService.findAll().subscribe((data: any) => {
        this.cities = data.data;
      });
    } else {
      this.onProvinceButtonClick(selectedProvince);
    }
  }

  // Método para verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.selectedProvinceId !== '' && this.selectedProvinceId !== null;
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    // Limpiar la propiedad del componente
    // Con [(ngModel)] el DOM se actualiza automáticamente
    this.selectedProvinceId = '';
    
    // Recargar todas las ciudades
    this.cityService.findAll().subscribe((data: any) => {
      this.cities = data.data;
    });
  }

  onPostCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      let upperCaseValue = input.value.toUpperCase();
      
      // Filtrar solo caracteres alfanuméricos
      upperCaseValue = upperCaseValue.replace(/[^A-Z0-9]/g, '');
      
      // Limitar a máximo 10 caracteres
      if (upperCaseValue.length > 10) {
        upperCaseValue = upperCaseValue.substring(0, 10);
      }
      
      input.value = upperCaseValue;
      
      // También actualizar el modelo vinculado directamente
      // Buscar la ciudad correspondiente en el array y actualizar su editPostCode
      const formElement = input.closest('form') || input.closest('.card-body');
      if (formElement) {
        const cityElements = document.querySelectorAll('.card-body');
        const currentIndex = Array.from(cityElements).findIndex(element => element.contains(input));
        if (currentIndex >= 0 && this.cities[currentIndex]) {
          this.cities[currentIndex].editPostCode = upperCaseValue;
        }
      }
    }
  }

  // Métodos auxiliares para el control de edición
  private hasCitiesInEditMode(): boolean {
    return this.cities.some(city => city.editing === true);
  }

  private cancelAllEdits(): void {
    this.cities.forEach(city => {
      if (city.editing) {
        this.cancelEdit(city);
      }
    });
  }

  // Implementación de EditingComponent
  hasUnsavedChanges(): boolean {
    return this.hasCitiesInEditMode();
  }

  async handleUnsavedChanges(): Promise<boolean> {
    return this.utils.showConfirm(
      'Ciudad en edición',
      'Estás editando una ciudad. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.cancelAllEdits();
        return true;
      }
      return false;
    });
  }
}
