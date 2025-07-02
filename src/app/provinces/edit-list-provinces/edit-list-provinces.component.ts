import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProvinceService } from 'src/app/services/province.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

interface Province{
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


export class EditListProvincesComponent implements OnInit {
  provinces: Province[] = [];

  constructor(
    private provinceService: ProvinceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {

    this.provinceService.provinces$.subscribe({
      next: (provinces: Province[]) => {
        this.provinces = provinces; // Direct assignment as it's already transformed by service
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
      }
    });
  }
  
delete(id: string) {
  this.provinceService.findCitiesByProvince(id).subscribe({
    next: (foundCities: any) => {
      // Check if response is empty array or has empty data property
      const hasCities = Array.isArray(foundCities) ? 
                       foundCities.length > 0 : 
                       (foundCities.data && foundCities.data.length > 0);

      if (!hasCities) {
        Swal.fire({
          title: 'Desea eliminar la provincia',
          text: 'Esta acción no se puede deshacer',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e7c633',
          cancelButtonColor: '#f76666',
          confirmButtonText: 'Aceptar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.provinceService.delete(id).subscribe({
              next: () => {
                this.provinces = this.provinces.filter(p => p.id !== id);
                Swal.fire(
                  'Eliminado!',
                  'La provincia ha sido eliminada.',
                  'success'
                );
              },
              error: (error) => {
                console.error('Error deleting province:', error);
                Swal.fire(
                  'Error!',
                  'No se pudo eliminar la provincia.',
                  'error'
                );
              }
            });
          }
        });
      } else {
        Swal.fire(
          'Error!',
          'No se puede eliminar la provincia porque tiene ciudades asociadas.',
          'error'
        );
      }
    },
    error: (error) => {
      console.error('Error checking cities:', error);
      Swal.fire(
        'Error!',
        'Error al verificar ciudades asociadas.',
        'error'
      );
    }
  });
}
  
  edit(province: any): void {
    province.editName = province.name;
    province.editing = true;
  }

  
save(province: any): void {
  if (!province.editName) { 
    Swal.fire({
      icon: 'error',
      title: 'Error en el registro',
      text: 'Debe completar el campo.',
    });
  } else {   
    if (province.editName !== province.name) {
      province.name= province.editName.charAt(0).toUpperCase() + province.editName.slice(1).toLowerCase();
      this.provinceService.findProvinceByName(province.name)
      .subscribe(
        (existingProvince: any) => {
          if (existingProvince === null) {
          this.provinceService.update(province).subscribe(
          (response: any) => {
            console.log(response);
            Swal.fire(
            'Provincia registrada con éxito!!',
            '',
            'success'
            );
            province.editing = false;
          },
          (err: any) => {
            console.log(err);
            Swal.fire({
              icon: 'error',
              title: 'Registro fallido',
              text: err.message,
              });
            }
          );
     
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El nombre ya está registrado',
              });
            }      
          },
          (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error en la verificación del nombre.',
            });
          }
        );
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se realizaron cambios en la provinica.',
      });
      province.editing = false;
    }
  }
}
}
  
  
  
   
