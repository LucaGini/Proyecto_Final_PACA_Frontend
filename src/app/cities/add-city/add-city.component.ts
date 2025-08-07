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

  onPostCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      let value = input.value.toUpperCase();
      
      // Filtrar solo caracteres alfanuméricos
      value = value.replace(/[^A-Z0-9]/g, '');
      
      // Limitar a máximo 10 caracteres
      if (value.length > 10) {
        value = value.substring(0, 10);
      }
      
      input.value = value;
    }
  }

  add(addForm: NgForm) {
    const newCity = addForm.value;

    const camposObligatorios = [
      newCity.name,
      newCity.postCode,
      newCity.surcharge,
      newCity.province
    ];

    if (!this.utils.areValidFields(camposObligatorios)) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
      return;
    }

    // Validar longitud del código postal
    if (newCity.postCode.length < 8 || newCity.postCode.length > 10) {
      this.utils.showAlert('error', 'Error en el código postal', 'El código postal debe tener entre 8 y 10 caracteres.');
      return;
    }

    // Validar que el código postal sea solo alfanumérico
    const alphanumericRegex = /^[A-Z0-9]+$/;
    if (!alphanumericRegex.test(newCity.postCode)) {
      this.utils.showAlert('error', 'Error en el código postal', 'El código postal solo puede contener letras y números.');
      return;
    }

    newCity.name = this.utils.capitalize(newCity.name ?? '');
    newCity.postCode = (newCity.postCode ?? '').toUpperCase();

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
