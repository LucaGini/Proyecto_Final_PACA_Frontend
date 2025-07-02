import { Component, OnInit } from '@angular/core';
import { CategoryService } from 'src/app/services/category.service';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm } from '@angular/forms';
  

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent {
  constructor(
    private categoryService: CategoryService,
    private router: Router,
  ) {}
    
add(addForm: NgForm) {  
  const newCategory = addForm.value;
  newCategory.name = newCategory.name.toLowerCase();
  this.categoryService.findCategoryByName(newCategory.name)
  .subscribe(
    (existingCategory: any) => {
      if (existingCategory === null) {
        this.categoryService.add(newCategory).subscribe(
        (response: any) => {
          Swal.fire(
          'Categoría registrada con éxito!!',
          '',
          'success'
          )
          addForm.resetForm();
          this.router.navigate(['AdminCategories']);
        },
        (err: any) => {
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
    }
  }