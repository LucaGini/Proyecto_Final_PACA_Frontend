import { Component } from '@angular/core';
import { ProvinceService } from 'src/app/services/province.service';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service'; 

@Component({
  selector: 'app-add-province',
  templateUrl: './add-province.component.html',
  styleUrls: ['./add-province.component.scss']
})
export class AddProvinceComponent {

  constructor(
    private provinceService: ProvinceService,
    private router: Router,
    private utils: UtilsService 
  ) {}

  add(addForm: NgForm) {
    const newProvince = addForm.value;

    if (!this.utils.isValid(newProvince.name)) {
      this.utils.showAlert('error', 'Error', 'Debe ingresar un nombre válido.');
      return;
    }

    if (!this.utils.areValidFields(newProvince.name)) {
      this.utils.showAlert('error', 'Error', 'Debe completar todos los campos.');
      return;
    }

    newProvince.name = this.utils.capitalize(newProvince.name);

    this.provinceService.findProvinceByName(newProvince.name)
      .subscribe({
        next: (existingProvince: any) => {
          if (existingProvince === null) {
            this.provinceService.add(newProvince).subscribe({
              next: () => {
                this.utils.showAlert('success', 'Provincia registrada con éxito!!');
                addForm.resetForm();
                this.router.navigate(['AdminProvinces']);
              },
              error: (err: any) => {
                console.error(err);
                this.utils.showAlert('error', 'Registro fallido', err.message);
              }
            });
          } else {
            this.utils.showAlert('error', 'Error', 'El nombre ya está registrado');
          }
        },
        error: (err: any) => {
          console.error(err);
          this.utils.showAlert('error', 'Error', 'Error en la verificación del nombre.');
        }
      });
  }
}
