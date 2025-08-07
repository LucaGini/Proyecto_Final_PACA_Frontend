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
  category.editName = this.utils.capitalize(category.editName ?? '');

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
    this.categoryService.update({...category, name: updated.name, description: updated.description}).subscribe({
      next: (response: any) => {
        this.utils.showAlert('success', 'Categoría actualizada con éxito!!');
        this.utils.copyProperties(category, updated);
        category.editing = false;
      },
      error: (err: any) => {
        if (err.status === 409) {
          this.utils.showAlert('error', 'Error', 'El nombre ya está registrado');
        } else {
          this.utils.showAlert('error', 'Registro fallido', err.message || 'Error desconocido');
        }
      }
    });
  } else {
    this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en la categoría.');
    category.editing = false;
  }
}

}
