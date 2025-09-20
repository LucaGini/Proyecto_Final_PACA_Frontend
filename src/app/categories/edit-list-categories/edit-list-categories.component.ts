import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { CategoryService } from 'src/app/services/category.service';
import { UtilsService } from 'src/app/services/utils.service';
import { EditGuardService, EditingComponent } from 'src/app/services/edit-guard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-list-categories',
  templateUrl: './edit-list-categories.component.html',
  styleUrls: ['./edit-list-categories.component.scss']
})
export class EditListCategoriesComponent implements OnDestroy, EditingComponent {
  categories: any[] = [];
  
  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'edit-list-categories';
  
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    this.categoryService.categories$.subscribe((data: any) => {
      this.categories = data;
    });
    
    // Listener para advertir al usuario antes de cerrar/recargar la página si hay ediciones pendientes
    window.addEventListener('beforeunload', this.beforeUnloadHandler.bind(this));
    
    // Interceptar navegación dentro de la SPA
    this.setupNavigationGuard();
  }

  ngOnDestroy() {
    // Desregistrar este componente del servicio de guardia
    this.editGuardService.unregisterComponent(this.componentName);
    
    // Limpiar el listener cuando el componente se destruya
    window.removeEventListener('beforeunload', this.beforeUnloadHandler.bind(this));
    // Limpiar suscripción del router
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private beforeUnloadHandler(event: BeforeUnloadEvent): void {
    if (this.hasCategoriesInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes categorías en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasCategoriesInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Categoría en edición',
            'Estás editando una categoría. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
          ).then((result) => {
            if (result.isConfirmed) {
              // Cancelar todas las ediciones
              this.cancelAllEdits();
              // Permitir la navegación
              this.allowNavigation = true;
              // Navegar a la URL que el usuario quería
              this.router.navigateByUrl(event.url).then(() => {
                // Resetear la bandera después de la navegación exitosa
                this.allowNavigation = false;
              });
            }
          });
        }
      }
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
    // Verificar si ya hay alguna categoría en edición
    if (this.hasCategoriesInEditMode()) {
      this.utils.showAlert('warning', 'Categoría en edición', 'Ya tienes una categoría en modo edición. Debes guardar o cancelar los cambios antes de editar otra categoría.');
      return;
    }

    category.editName = category.name;
    category.editDescription = category.description;
    category.editing = true;
  }

  cancelEdit(category: any): void {
    category.editing = false;
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

// Métodos auxiliares para el control de edición
private hasCategoriesInEditMode(): boolean {
  return this.categories.some(category => category.editing === true);
}

private cancelAllEdits(): void {
  this.categories.forEach(category => {
    if (category.editing) {
      this.cancelEdit(category);
    }
  });
}

// Implementación de EditingComponent
hasUnsavedChanges(): boolean {
  return this.hasCategoriesInEditMode();
}

async handleUnsavedChanges(): Promise<boolean> {
  return this.utils.showConfirm(
    'Categoría en edición',
    'Estás editando una categoría. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
  ).then((result) => {
    if (result.isConfirmed) {
      this.cancelAllEdits();
      return true;
    }
    return false;
  });
}
}