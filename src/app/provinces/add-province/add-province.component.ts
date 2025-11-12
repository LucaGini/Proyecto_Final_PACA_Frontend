import { Component, OnInit } from '@angular/core';
import { ProvinceService } from 'src/app/services/province.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-province',
  templateUrl: './add-province.component.html',
  styleUrls: ['./add-province.component.scss']
})
export class AddProvinceComponent implements OnInit {

  // Provincias de Argentina disponibles para registrar
  provinces: string[] = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa',
    'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
    'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ];

  registeredProvinces: string[] = [];
  availableProvinces: string[] = [];

  constructor(
    private provinceService: ProvinceService,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
  this.provinceService.provinces$.subscribe({
    next: (data: any[]) => {
      this.registeredProvinces = data.map(p => p.name.toLowerCase());
      this.filterAvailableProvinces();
    },
    error: (err) => console.error('Error cargando provincias registradas', err)
  });
}



  filterAvailableProvinces(): void {
    // Filtramos las provincias que aún no están registradas
    this.availableProvinces = this.provinces.filter(
      p => !this.registeredProvinces.includes(p.toLowerCase())
    );
  }

  add(addForm: NgForm): void {
    const newProvince = addForm.value;

    if (!this.utils.isValid(newProvince.name)) {
      this.utils.showAlert('error', 'Error', 'Debe seleccionar una provincia válida.');
      return;
    }

    newProvince.name = this.utils.capitalize(newProvince.name);

    this.provinceService.findProvinceByName(newProvince.name).subscribe({
      next: (existingProvince: any) => {
        if (existingProvince === null) {
          this.provinceService.add(newProvince).subscribe({
            next: () => {
              this.utils.showAlert('success', 'Provincia registrada con éxito!!');
              addForm.resetForm({ name: '' });

              // Navegamos si querés mantener ese comportamiento
              this.router.navigate(['AdminProvinces']);
            },
            error: (err: any) => {
              console.error(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            }
          });
        } else {
          this.utils.showAlert('error', 'Error', 'La provincia ya está registrada!');
        }
      },
      error: (err: any) => {
        console.error(err);
        this.utils.showAlert('error', 'Error', 'Error en la verificación del nombre.');
      }
    });
  }
}
