import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CityService } from 'src/app/services/city.service';
import { ProvinceService } from 'src/app/services/province.service';
import { FilterCitiesProvinceService } from 'src/app/services/filters/filter-cities-province.service';
import { Router } from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-edit-list-cities',
  templateUrl: './edit-list-cities.component.html',
  styleUrls: ['./edit-list-cities.component.scss']
})
export class EditListCitiesComponent {

  cities: any[] = [];
  provinces: any[] = [];
  selectedProvinceId: string = '';

  constructor(
    private cityService: CityService,
    private provinceService: ProvinceService,
    private filterCitiesProvinceService: FilterCitiesProvinceService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.getProvinces();
    this.cityService.cities$.subscribe((data: any) => {
      this.cities = data;
    });

    this.filterCitiesProvinceService.provinceSelected$.subscribe(async (provinceId: string) => {
      await this.provinceService.findCitiesByProvince(provinceId).subscribe((data: any) => {
        this.cities = data;
      });
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
}
