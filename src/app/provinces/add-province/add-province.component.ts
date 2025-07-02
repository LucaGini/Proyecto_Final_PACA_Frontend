import { Component } from '@angular/core';
import { ProvinceService } from 'src/app/services/province.service';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-province',
  templateUrl: './add-province.component.html',
  styleUrls: ['./add-province.component.scss']
})
export class AddProvinceComponent {
  constructor(
    private provinceService: ProvinceService,
    private router: Router,
  ) {}

  add(addForm: NgForm) {  
    const newProvince = addForm.value;
    newProvince.name = newProvince.name.charAt(0).toUpperCase() + newProvince.name.slice(1).toLowerCase();
      this.provinceService.findProvinceByName(newProvince.name)
      .subscribe(
        (existingProvince: any) => {
          if (existingProvince === null) {
          this.provinceService.add(newProvince).subscribe(
          (response: any) => {
            console.log(response);
            Swal.fire(
            'Provincia registrada con éxito!!',
            '',
            'success'
            );
            addForm.resetForm(); 
            this.router.navigate(['AdminProvinces']);
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
        console.log(err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error en la verificación del nombre.',
          });
        }
      );
      }
    }

  
  
  
   