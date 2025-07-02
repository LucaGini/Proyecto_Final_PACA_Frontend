import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from 'src/app/services/category.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-list-categories',
  templateUrl: './edit-list-categories.component.html',
  styleUrls: ['./edit-list-categories.component.scss']
})
export class EditListCategoriesComponent {
  categories: any[] = [];
  
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
    
  ngOnInit() {
    this.categoryService.categories$.subscribe((data: any) => {
      this.categories = data;
    });
  }

  delete(category: any): void {
    this.categoryService.findProductsByCategory(category.name)
      .subscribe(
        (foundProducts: any) => {
          if (foundProducts.data && foundProducts.data.length === 0) { 
            Swal.fire({
              title: 'Desea eliminar la categoría',
              text: 'Esta acción no se puede deshacer',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#e7c633',
              cancelButtonColor: '#f76666',
              confirmButtonText: 'Aceptar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.categoryService.delete(category.id).subscribe({
                  next: res => {
                    Swal.fire(
                      'Confirmado',
                      'La acción ha sido confirmada',
                      'success'
                    );
                    this.categories = this.categories.filter(c => c.id !== category.id);  
                    // tuve que cambiarlo, ya que no le pasamos solamente el id como parámetro como estaba antes por el método
                    // No se si conviene cambiarlo y hacer métodos separados o usar el mismo 
                    // en este caso estamos usando el mismo.
                    // mismo caso en proveedores
                  },
                  error: err => {
                    console.log(err);
                  }
                });
              }
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se puede eliminar la categoría, ya que tiene productos asociados ',
            });
          }
        },
        error => {
          console.log(error);
        }
      );
  }
  
edit(category: any): void {
  category.editName = category.name;
  category.editDescription = category.description;
  category.editing = true;
}

save(category: any): void {
  if (!category.editName || !category.editDescription) { 
    Swal.fire({
      icon: 'error',
      title: 'Error en el registro',
      text: 'Debe completar todos los campos.',
    });
  } else {   
    if (category.editName !== category.name || category.editDescription !== category.description) {
      category.editName = category.editName.toLowerCase();
      this.categoryService.findCategoryByName(category.editName)
      .subscribe(
        (existingCategory: any) => {
          if (existingCategory === null || category.name === category.editName ) {
          category.name = category.editName;
          category.description = category.editDescription;
          this.categoryService.update(category).subscribe(
          (response: any) => {
            Swal.fire(
            'Categoría registrada con éxito!!',
            '',
            'success'
            );
            category.editing = false;
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
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se realizaron cambios en la categoría.',
      });
      category.editing = false;
    }
  }
}
}