import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CityService } from 'src/app/services/city.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


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
    private router: Router
  ) {}

  ngOnInit() {
    this.cityService.cities$.subscribe((data: any) => {
      this.cities = data;
    });
  }

  delete(city: any): void { 
      this.cityService.findUsersByCity(city.postCode)
        .subscribe(
          (foundusers: any) => {
            if (foundusers.data && foundusers.data.length === 0) { 
              Swal.fire({
                title: 'Desea eliminar la ciudad',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e7c633',
                cancelButtonColor: '#f76666',
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  this.cityService.delete(city.id).subscribe({
                    next: res => {
                      Swal.fire(
                        'Confirmado',
                        'La acción ha sido confirmada',
                        'success'
                      );
                      this.cities = this.cities.filter(c => c.id !== city.id);  
                      // tuve que cambiarlo, ya que no le pasamos solamente el id como parámetro como estaba antes por el método
                      // No se si conviene cambiarlo y hacer métodos separados o usar el mismo 
                      // en este caso estamos usando el mismo.
                      // mismo caso en proveedores
                    },
                    error: err => {
                      console.log(err);
                    }
                  });
                }
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se puede eliminar la ciudad, ya que tiene usuarios asociados ',
              });
            }
          },
          error => {
            console.log(error);
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
    if (!city.editName || !city.editPostCode || !city.editSurcharge ) { 
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'Debe completar todos los campos.',
      });
    } else {   
      if (city.editName !== city.name || city.editPostCode !== city.postCode || city.editSurcharge !== city.surcharge) {
        this.cityService.findCityByPostCode(city.editPostCode)
        .subscribe(
          (existingCity: any) => {
            if (existingCity === null || city.postCode === city.editPostCode ) {
            city.name = city.editName.charAt(0).toUpperCase() + city.editName.slice(1).toLowerCase();
            city.postCode = city.editPostCode;
            city.surcharge = city.editSurcharge;
            this.cityService.update(city).subscribe(
            (response: any) => {
              Swal.fire(
              'Ciudad registrada con éxito!!',
              '',
              'success'
              );
              city.editing = false;
            },
            (err: any) => {
              console.log(err);
              Swal.fire({
                icon: 'error',
                title: 'Registro fallido',
                text: 'El código postal ya está registrado',
                });
              }
            );
       
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'El código postal ya está registrado',
                });
              }      
            },
            (err: any) => {
              console.log(err);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error en la verificación del código postal.',
              });
            }
          );
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Sin cambios',
          text: 'No se realizaron cambios en la ciudad.',
        });
        city.editing = false;
      }
    }
  }
}

  
  
   
  
  
  
   
