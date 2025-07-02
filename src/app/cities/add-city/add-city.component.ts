import { Component } from '@angular/core';
import { CityService } from 'src/app/services/city.service';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
import { ProvinceService } from 'src/app/services/province.service';

interface Province{
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
    private provinceservice: ProvinceService
  ) {}
  
  ngOnInit(): void {
    this.getProvinces();
  }

  getProvinces(){
    this.provinceservice.findAll().subscribe({
      next: (provinces: Province[]) => {
        this.provinces = provinces; // Direct assignment as it's already transformed by service
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
      }
    });
  }

  add(addForm: NgForm) {  
    const newCity = addForm.value;
      this.cityService.findCityByPostCode(newCity.postCode)
      .subscribe(
        (existingCity: any) => {
          if (existingCity === null) {
            
          newCity.name = newCity.name.charAt(0).toUpperCase() + newCity.name.slice(1).toLowerCase();
          this.cityService.add(newCity).subscribe(
          (response: any) => {
            Swal.fire(
            'Ciudad registrada con éxito!!',
            '',
            'success'
            );
            addForm.resetForm();
            this.router.navigate(['AdminCities']);
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
    }
  }
  
  


  
  