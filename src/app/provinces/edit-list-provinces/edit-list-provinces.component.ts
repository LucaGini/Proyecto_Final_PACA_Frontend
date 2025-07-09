import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProvinceService } from 'src/app/services/province.service';
import { UtilsService } from 'src/app/services/utils.service';

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
export class EditListProvincesComponent implements OnInit {
  provinces: Province[] = [];

  constructor(
    private provinceService: ProvinceService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.provinceService.provinces$.subscribe({
      next: (provinces: Province[]) => {
        this.provinces = provinces;
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
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
    province.editName = province.name;
    province.editing = true;
  }

  save(province: Province): void {
    if (!this.utils.isValid(province.editName ?? '')) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar el campo.');
    } else {
      if (province.editName !== province.name) {
        province.name = this.utils.capitalize(province.editName ?? '');
        this.provinceService.findProvinceByName(province.name).subscribe(
          (existingProvince: any) => {
            if (existingProvince === null) {
              this.provinceService.update(province).subscribe(
                (response: any) => {
                  console.log(response);
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
  }
}
