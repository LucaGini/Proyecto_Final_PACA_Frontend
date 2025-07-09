import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CityService } from 'src/app/services/city.service';
import { Router } from '@angular/router';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-edit-list-cities',
  templateUrl: './edit-list-cities.component.html',
  styleUrls: ['./edit-list-cities.component.scss']
})
export class EditListCitiesComponent {

  cities: any[] = [];

  constructor(
    private cityService: CityService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.cityService.cities$.subscribe((data: any) => {
      this.cities = data;
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
    city.editPostCode = city.postCode;
    city.editSurcharge = city.surcharge;
    city.editing = true;
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
    } /// se elimina si se implementa lo de categorías en el html

    if (this.utils.hasObjectChanged(original, updated)) {
      updated.name = this.utils.capitalize(updated.name ?? '');

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
}
