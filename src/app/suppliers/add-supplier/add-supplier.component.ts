import { Component } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import { Router } from "@angular/router";
import { NgForm, FormControl, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-add-supplier',
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.scss']
})
export class AddSupplierComponent {

  cuitControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/)
  ]);

  constructor(
    private supplierService: SupplierService,
    private router: Router,
    private utils: UtilsService 
  ) {}

  add(addForm: NgForm) {
    if (this.cuitControl.invalid) {
      this.utils.showAlert('error', 'Error en el registro', 'El CUIT debe tener exactamente 11 caracteres numéricos.');
      return;
    }

    const newSupplier = {
      ...addForm.value,
      cuit: this.cuitControl.value
    };

    
    const camposObligatorios = [
      newSupplier.businessName,
      newSupplier.email,
      newSupplier.phone,
      newSupplier.cuit
    ];

    if (!this.utils.areValidFields(camposObligatorios)) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
      return;
    }

    newSupplier.businessName = this.utils.capitalize(newSupplier.businessName ?? '');

    this.supplierService.findSupplierByCuit(newSupplier.cuit)
      .subscribe({
        next: (existingSupplier: any) => {
          if (existingSupplier === null) {
            this.supplierService.add(newSupplier).subscribe({
              next: () => {
                this.utils.showAlert('success', 'Proveedor agregado con éxito!!');
                addForm.resetForm();
                this.router.navigate(['AdminSuppliers']);
              },
              error: (err: any) => {
                console.error(err);
                this.utils.showAlert('error', 'Registro fallido', 'Ha ocurrido un error al registrar el proveedor.');
              }
            });
          } else {
            this.utils.showAlert('error', 'Error', 'El CUIT ya está registrado');
          }
        },
        error: (err: any) => {
          console.error(err);
          this.utils.showAlert('error', 'Error', 'Error en la verificación del CUIT.');
        }
      });
  }
}
