import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupplierService } from 'src/app/services/supplier.service';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-edit-list-suppliers',
  templateUrl: './edit-list-suppliers.component.html',
  styleUrls: ['./edit-list-suppliers.component.scss']
})
export class EditListSuppliersComponent {
  suppliers: any[] = [];

  cuitControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/)
  ]);

  constructor(
    private supplierService: SupplierService,
    private route: ActivatedRoute,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.supplierService.suppliers$.subscribe((data: any) => {
      this.suppliers = data;
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
    supplier.editBusinessName = supplier.businessName;
    supplier.editEmail = supplier.email;
    supplier.editPhone = supplier.phone;
    supplier.editCuit = supplier.cuit;
    supplier.editing = true;
    this.cuitControl.setValue(supplier.cuit);
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

  if (!updated.businessName || !updated.email || !updated.phone || !updated.cuit) {
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
}