import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { ProvinceService } from 'src/app/services/province.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EditGuardService, EditingComponent } from 'src/app/services/edit-guard.service';
import { Subscription } from 'rxjs';

interface Province {
  id: string;
  name: string;
  editing?: boolean;
  editName?: string;
}

@Component({
  selector: 'app-edit-list-provinces',
  templateUrl: './edit-list-provinces.component.html',
  styleUrls: ['./edit-list-provinces.component.scss']
})
export class EditListProvincesComponent implements OnInit, OnDestroy, EditingComponent {
  provinces: Province[] = [];

  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'edit-list-provinces';

  constructor(
    private provinceService: ProvinceService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    this.provinceService.provinces$.subscribe({
      next: (provinces: Province[]) => {
        this.provinces = provinces;
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
      }
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
    if (this.hasProvincesInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes provincias en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasProvincesInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Provincia en edición',
            'Estás editando una provincia. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
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

  delete(id: string) {
    this.provinceService.findCitiesByProvince(id).subscribe({
      next: (foundCities: any) => {
        const hasCities = Array.isArray(foundCities)
          ? foundCities.length > 0
          : (foundCities.data && foundCities.data.length > 0);

        if (!hasCities) {
          this.utils.showConfirm('Desea eliminar la provincia', 'Esta acción no se puede deshacer')
            .then((result) => {
              if (result.isConfirmed) {
                this.provinceService.delete(id).subscribe({
                  next: () => {
                    this.provinces = this.provinces.filter(p => p.id !== id);
                    this.utils.showAlert('success', 'Eliminado!', 'La provincia ha sido eliminada.');
                  },
                  error: (error) => {
                    console.error('Error deleting province:', error);
                    this.utils.showAlert('error', 'Error!', 'No se pudo eliminar la provincia.');
                  }
                });
              }
            });
        } else {
          this.utils.showAlert('error', 'Error!', 'No se puede eliminar la provincia porque tiene ciudades asociadas.');
        }
      },
      error: (error) => {
        console.error('Error checking cities:', error);
        this.utils.showAlert('error', 'Error!', 'Error al verificar ciudades asociadas.');
      }
    });
  }

  edit(province: Province): void {
    // Verificar si ya hay alguna provincia en edición
    if (this.hasProvincesInEditMode()) {
      this.utils.showAlert('warning', 'Provincia en edición', 'Ya tienes una provincia en modo edición. Debes guardar o cancelar los cambios antes de editar otra provincia.');
      return;
    }

    province.editName = province.name;
    province.editing = true;
  }

  cancelEdit(province: Province): void {
    province.editing = false;
  }

  save(province: Province): void {
    const original = { name: province.name };
    const updated = { name: province.editName };

    if (!this.utils.isValid(province.editName ?? '')) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar el campo.');
      return;
    }

    updated.name = this.utils.capitalize(updated.name ?? '');

    if (this.utils.hasObjectChanged(original, updated)) {
      this.provinceService.findProvinceByName(updated.name).subscribe(
        (existingProvince: any) => {
          if (existingProvince === null || province.name === updated.name) {
            this.utils.copyProperties(province, updated);
            this.provinceService.update(province).subscribe(
              (response: any) => {
                this.utils.showAlert('success', 'Provincia registrada con éxito!!');
                province.editing = false;
              },
              (err: any) => {
                console.log(err);
                this.utils.showAlert('error', 'Registro fallido', err.message);
              }
            );
          } else {
            this.utils.showAlert('error', 'Error', 'El nombre ya está registrado');
          }
        },
        (err: any) => {
          this.utils.showAlert('error', 'Error', 'Error en la verificación del nombre.');
        }
      );
    } else {
      this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en la provincia.');
      province.editing = false;
    }
  }

  // Métodos auxiliares para el control de edición
  private hasProvincesInEditMode(): boolean {
    return this.provinces.some(province => province.editing === true);
  }

  private cancelAllEdits(): void {
    this.provinces.forEach(province => {
      if (province.editing) {
        this.cancelEdit(province);
      }
    });
  }

  // Implementación de EditingComponent
  hasUnsavedChanges(): boolean {
    return this.hasProvincesInEditMode();
  }

  async handleUnsavedChanges(): Promise<boolean> {
    return this.utils.showConfirm(
      'Provincia en edición',
      'Estás editando una provincia. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.cancelAllEdits();
        return true;
      }
      return false;
    });
  }
}
