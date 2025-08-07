import { Component } from '@angular/core';
import { CategoryService } from 'src/app/services/category.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss'],
})
export class AddCategoryComponent {
  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private utils: UtilsService
  ) {}

  add(addForm: NgForm) {
    const newCategory = addForm.value;

    if (!this.utils.areValidFields([newCategory.name, newCategory.description])) {
      this.utils.showAlert('error', 'Error', 'Debe completar todos los campos.');
      return;
    }

    if (!this.utils.isValid(newCategory.name)) {
      this.utils.showAlert('error', 'Error', 'Debe ingresar un nombre válido.');
      return;
    }

    newCategory.name = this.utils.capitalize(newCategory.name);

    this.categoryService.add(newCategory).subscribe({
      next: () => {
        this.utils.showAlert('success', 'Categoría registrada con éxito!!');
        addForm.resetForm();
        this.router.navigate(['AdminCategories']);
      },
      error: (err: any) => {
        if (err.status === 409) {
          this.utils.showAlert('error', 'Error', 'El nombre ya está registrado.');
        } else {
          this.utils.showAlert('error', 'Error', err.message);
        }
      },
    });
  }
}
