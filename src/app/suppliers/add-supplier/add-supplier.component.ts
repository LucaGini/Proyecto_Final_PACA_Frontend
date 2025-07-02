import { Component } from '@angular/core';
import { SupplierService } from '../../services/supplier.service';
import Swal from 'sweetalert2';
import { Router } from "@angular/router";
import { NgForm, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-supplier',
  templateUrl: './add-supplier.component.html',
  styleUrls: ['./add-supplier.component.scss']
})
export class AddSupplierComponent {

  cuitControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/) // 11 digits
  ]);

  constructor(
    private supplierService: SupplierService,
    private router: Router,
  ) {}

  add(addForm: NgForm) {
    if (this.cuitControl.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'El CUIT debe tener exactamente 11 caracteres numéricos.',
      });
      return;
    }

    const newSupplier = {
      ...addForm.value,
      cuit: this.cuitControl.value,
    };
  this.supplierService.findSupplierByCuit(newSupplier.cuit)
    .subscribe(
      (existingSupplier: any) => {
        if (existingSupplier === null) {              
          this.supplierService.add(newSupplier).subscribe(
            (response: any) => {
              Swal.fire(
                'Proveedor agregado con éxito!!',
                '',
                'success'
              );
              addForm.resetForm();
              this.router.navigate(['AdminSuppliers']);
            },
            (err: any) => {
              console.log(err);
              Swal.fire({
                icon: 'error',
                title: 'Registro fallido',
                text: 'Ha ocurrido un error al registrar el proveedor.',
              });
            }
          );
        } else {
          // Add this else block to handle existing CUIT
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'El CUIT ya está registrado',
          });
        }
      },
      (err: any) => {
        console.log(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error en la verificación del CUIT.',
        });
      }
    );
  }
}
