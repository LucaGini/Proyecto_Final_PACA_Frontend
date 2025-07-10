import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'src/app/services/category.service';
import { UtilsService } from 'src/app/services/utils.service';

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
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.categoryService.categories$.subscribe((data: any) => {
      this.categories = data;
    });
  }

  delete(category: any): void {
    this.categoryService.findProductsByCategory(category.name).subscribe(
      (foundProducts: any) => {
        if (foundProducts.data && foundProducts.data.length === 0) {
          this.utils.showConfirm('Desea eliminar la categoría', 'Esta acción no se puede deshacer')
            .then((result) => {
              if (result.isConfirmed) {
                this.categoryService.delete(category.id).subscribe({
                  next: res => {
                    this.utils.showAlert('success', 'Confirmado', 'La acción ha sido confirmada');
                    this.categories = this.categories.filter(c => c.id !== category.id);
                  },
                  error: err => {
                    console.log(err);
                    this.utils.showAlert('error', 'Error', 'No se pudo eliminar la categoría.');
                  }
                });
              }
            });
        } else {
          this.utils.showAlert('error', 'Error', 'No se puede eliminar la categoría, ya que tiene productos asociados.');
        }
      },
      error => {
        console.log(error);
        this.utils.showAlert('error', 'Error', 'Error al verificar productos asociados.');
      }
    );
  }

  edit(category: any): void {
    category.editName = category.name;
    category.editDescription = category.description;
    category.editing = true;
  }

 save(category: any): void {
  const original = {
    name: category.name,
    description: category.description
  };

  const updated = {
    name: category.editName,
    description: category.editDescription
  };
  
  if (!this.utils.areValidFields([category.editName, category.editDescription])) {
  this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
  return;
}
  if (this.utils.hasObjectChanged(original, updated)) {
    category.editName = this.utils.capitalize(category.editName ?? '');

    this.categoryService.findCategoryByName(category.editName).subscribe(
      (existingCategory: any) => {
        if (existingCategory === null || category.name === category.editName) {
          this.utils.copyProperties(category,updated)
          this.categoryService.update(category).subscribe(
            (response: any) => {
              this.utils.showAlert('success', 'Categoría registrada con éxito!!');
              category.editing = false;
            },
            (err: any) => {
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
    this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en la categoría.');
    category.editing = false;
  }
}
}