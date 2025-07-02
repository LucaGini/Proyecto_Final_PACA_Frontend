import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupplierService } from 'src/app/services/supplier.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';

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
    private router: Router
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
            Swal.fire({
              title: 'Desea eliminar el proveedor',
              text: 'Esta acción no se puede deshacer',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#e7c633',
              cancelButtonColor: '#f76666',
              confirmButtonText: 'Aceptar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.supplierService.delete(supplier.id).subscribe({
                  next: res => {
                    Swal.fire(
                      'Confirmado',
                      'La acción ha sido confirmada',
                      'success'
                    );
                    this.suppliers = this.suppliers.filter(s => s.id !== supplier.id);  
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
              text: 'No se puede eliminar el proveedor, ya que tiene productos asociados ',
            });
          }
        },
        error => {
          console.log(error);
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
    if (!supplier.editBusinessName || !supplier.editEmail || !supplier.editPhone || !supplier.editCuit) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'Debe completar todos los campos.',
      });
      return;
    }

    if (!this.validateCuit(supplier.editCuit)) {
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'El CUIT debe tener exactamente 11 caracteres numéricos.',
      });
      return;
    }

    if (supplier.businessName !== supplier.editBusinessName || 
        supplier.email !== supplier.editEmail || 
        supplier.phone !== supplier.editPhone || 
        supplier.cuit !== supplier.editCuit) {
      
      this.supplierService.findSupplierByCuit(supplier.editCuit)
        .subscribe({
          next: (existingsupplier: any) => {
            if (existingsupplier === null || supplier.cuit === supplier.editCuit) {
              supplier.cuit = supplier.editCuit;
              supplier.businessName = supplier.editBusinessName.charAt(0).toUpperCase() + 
                                    supplier.editBusinessName.slice(1).toLowerCase();
              supplier.email = supplier.editEmail;
              supplier.phone = supplier.editPhone;
              
              this.supplierService.update(supplier).subscribe({
                next: (response: any) => {
                  Swal.fire(
                    'Proveedor actualizado con éxito!!',
                    '',
                    'success'
                  );
                  supplier.editing = false;
                },
                error: (err: any) => {
                  console.log(err);
                  Swal.fire({
                    icon: 'error',
                    title: 'Actualización fallida',
                    text: err.message,
                  });
                }
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El CUIT ya está registrado',
              });
            }
          },
          error: (err: any) => {
            console.log(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error en la verificación del CUIT.',
            });
          }
        });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No se realizaron cambios en el proveedor.',
      });
      supplier.editing = false;
    }
  }
}

