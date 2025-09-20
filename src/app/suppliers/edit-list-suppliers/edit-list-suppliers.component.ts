import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { SupplierService } from 'src/app/services/supplier.service';
import { FormControl, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';
import { EditGuardService, EditingComponent } from 'src/app/services/edit-guard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-list-suppliers',
  templateUrl: './edit-list-suppliers.component.html',
  styleUrls: ['./edit-list-suppliers.component.scss']
})
export class EditListSuppliersComponent implements OnDestroy, EditingComponent {
  suppliers: any[] = [];

  cuitControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/)
  ]);

  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'edit-list-suppliers';

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    this.supplierService.suppliers$.subscribe((data: any) => {
      this.suppliers = data;
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
    if (this.hasSuppliersInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes proveedores en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasSuppliersInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Proveedor en edición',
            'Estás editando un proveedor. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
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

  delete(supplier: any): void {
    this.supplierService.findProductsBySupplier(supplier.cuit)
      .subscribe(
        (foundProducts: any) => {
          if (foundProducts.data && foundProducts.data.length === 0) {
            this.utils.showConfirm('Desea eliminar el proveedor', 'Esta acción no se puede deshacer')
              .then((result) => {
                if (result.isConfirmed) {
                  this.supplierService.delete(supplier.id).subscribe({
                    next: res => {
                      this.utils.showAlert('success', 'Confirmado', 'La acción ha sido confirmada');
                      this.suppliers = this.suppliers.filter(s => s.id !== supplier.id);
                    },
                    error: err => {
                      console.log(err);
                      this.utils.showAlert('error', 'Error', 'No se pudo eliminar el proveedor.');
                    }
                  });
                }
              });
          } else {
            this.utils.showAlert('error', 'Error', 'No se puede eliminar el proveedor, ya que tiene productos asociados.');
          }
        },
        error => {
          console.log(error);
          this.utils.showAlert('error', 'Error', 'Error al verificar productos asociados.');
        }
      );
  }

  edit(supplier: any): void {
    // Verificar si ya hay algún proveedor en edición
    if (this.hasSuppliersInEditMode()) {
      this.utils.showAlert('warning', 'Proveedor en edición', 'Ya tienes un proveedor en modo edición. Debes guardar o cancelar los cambios antes de editar otro proveedor.');
      return;
    }

    supplier.editBusinessName = supplier.businessName;
    supplier.editEmail = supplier.email;
    supplier.editPhone = supplier.phone;
    supplier.editCuit = supplier.cuit;
    supplier.editing = true;
    this.cuitControl.setValue(supplier.cuit);
  }

  cancelEdit(supplier: any): void {
    supplier.editing = false;
  }

  validateCuit(cuit: string): boolean {
    return /^[0-9]{11}$/.test(cuit);
  }

save(supplier: any): void {
  const original = {
    businessName: supplier.businessName,
    email: supplier.email,
    phone: supplier.phone,
    cuit: supplier.cuit
  };

  const updated = {
    businessName: supplier.editBusinessName,
    email: supplier.editEmail,
    phone: supplier.editPhone,
    cuit: supplier.editCuit
  };

  if (!this.utils.areValidFields([supplier.editBusinessName, supplier.editEmail, supplier.editPhone, supplier.editCuit])) {
    this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
    return;
  }

  if (!this.utils.validateEmail(updated.email)) {
    this.utils.showAlert('error', 'Email inválido', 'Ingrese un email válido.');
    return;
  }

  if (!this.utils.validateCuit(updated.cuit)) {
    this.utils.showAlert('error', 'Error en el registro', 'El CUIT debe tener exactamente 11 caracteres numéricos.');
    return;
  }

  if (this.utils.hasObjectChanged(original, updated)) {
    updated.businessName = this.utils.capitalize(updated.businessName ?? '');

    this.supplierService.findSupplierByCuit(updated.cuit)
      .subscribe({
        next: (existingSupplier: any) => {
          if (existingSupplier === null || supplier.cuit === updated.cuit) {
            this.utils.copyProperties(supplier, updated);
            this.supplierService.update(supplier).subscribe({
              next: () => {
                this.utils.showAlert('success', 'Proveedor actualizado con éxito!!');
                supplier.editing = false;
              },
              error: (err: any) => {
                console.log(err);
                this.utils.showAlert('error', 'Actualización fallida', err.message);
              }
            });
          } else {
            this.utils.showAlert('error', 'Error', 'El CUIT ya está registrado');
          }
        },
        error: (err: any) => {
          console.log(err);
          this.utils.showAlert('error', 'Error', 'Error en la verificación del CUIT.');
        }
      });
  } else {
    this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en el proveedor.');
    supplier.editing = false;
  }
}

// Métodos auxiliares para el control de edición
private hasSuppliersInEditMode(): boolean {
  return this.suppliers.some(supplier => supplier.editing === true);
}

private cancelAllEdits(): void {
  this.suppliers.forEach(supplier => {
    if (supplier.editing) {
      this.cancelEdit(supplier);
    }
  });
}

// Implementación de EditingComponent
hasUnsavedChanges(): boolean {
  return this.hasSuppliersInEditMode();
}

async handleUnsavedChanges(): Promise<boolean> {
  return this.utils.showConfirm(
    'Proveedor en edición',
    'Estás editando un proveedor. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
  ).then((result) => {
    if (result.isConfirmed) {
      this.cancelAllEdits();
      return true;
    }
    return false;
  });
}
}