import { Component } from '@angular/core';
import { CityService } from 'src/app/services/city.service';
import { ProvinceService } from 'src/app/services/province.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';

interface Province {
  id: string;
  name: string;
}

@Component({
  selector: 'app-add-city',
  templateUrl: './add-city.component.html',
  styleUrls: ['./add-city.component.scss']
})
export class AddCityComponent {
  provinces: Province[] = [];

  constructor(
    private router: Router,
    private cityService: CityService,
    private provinceservice: ProvinceService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.getProvinces();
  }

  getProvinces() {
    this.provinceservice.findAll().subscribe({
      next: (provinces: Province[]) => {
        this.provinces = provinces;
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las provincias.');
      }
    });
  }

  add(addForm: NgForm) {
    const newCity = addForm.value;

    // Validaciones básicas
    if (!this.utils.areValidFields([newCity.name, newCity.postCode, newCity.provinceId])) {
      this.utils.showAlert('error', 'Error', 'Debe completar todos los campos obligatorios.');
      return;
    }

    newCity.name = this.utils.capitalize(newCity.name);

    this.cityService.findCityByPostCode(newCity.postCode).subscribe({
      next: (existingCity: any) => {
        if (existingCity === null) {
          this.cityService.add(newCity).subscribe({
            next: () => {
              this.utils.showAlert('success', 'Ciudad registrada con éxito!!');
              addForm.resetForm();
              this.router.navigate(['AdminCities']);
            },
            error: (err: any) => {
              console.error(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            }
          });
        } else {
          this.utils.showAlert('error', 'Error', 'El código postal ya está registrado');
        }
      },
      error: (err: any) => {
        console.error(err);
        this.utils.showAlert('error', 'Error', 'Error en la verificación del código postal.');
      }
    });
  }
}
