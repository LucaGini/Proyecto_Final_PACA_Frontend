import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ProvinceService } from 'src/app/services/province.service';
import { UtilsService } from 'src/app/services/utils.service';
import { Subscription } from 'rxjs';

interface Province {
  id: string;
  name: string;
}

@Component({
  selector: 'app-edit-list-provinces',
  templateUrl: './edit-list-provinces.component.html',
  styleUrls: ['./edit-list-provinces.component.scss']
})
export class EditListProvincesComponent implements OnInit, OnDestroy {

  provinces: Province[] = [];
  private routerSubscription: Subscription = new Subscription();

  constructor(
    private provinceService: ProvinceService,
    private router: Router,
    private utils: UtilsService,
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

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  delete(id: string) {
    this.provinceService.findCitiesByProvince(id).subscribe({
      next: (foundCities: any) => {
        const hasCities = Array.isArray(foundCities)
          ? foundCities.length > 0
          : (foundCities.data && foundCities.data.length > 0);

        if (!hasCities) {
          this.utils.showConfirm(
            'Desea eliminar la provincia',
            'Esta acción no se puede deshacer'
          ).then((result) => {
            if (result.isConfirmed) {
              this.provinceService.delete(id).subscribe({
                next: () => {
                  this.provinces = this.provinces.filter(p => p.id !== id);
                  this.utils.showAlert('success', 'Eliminado!', 'La provincia ha sido eliminada.');
                  this.router.navigate(['AdminProvinces']);
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
}
