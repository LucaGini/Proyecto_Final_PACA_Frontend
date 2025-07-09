import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { Router } from '@angular/router';
import { SupplierService } from 'src/app/services/supplier.service';
import { FilterProductsSupplierService } from 'src/app/services/filter-products-supplier.service';
import { environment } from '../../../environments/environment';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-edit-list-products',
  templateUrl: './edit-list-products.component.html',
  styleUrls: ['./edit-list-products.component.scss']
})
export class EditListProductsComponent {
  products: any[] = [];
  suppliers: any[] = [];
  apiUrl = environment.apiUrl;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private filterProductsSupplierService: FilterProductsSupplierService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.getSuppliers();
    this.productService.products$.subscribe((data: any) => {
      this.products = data;
    });

    this.filterProductsSupplierService.supplierSelected$.subscribe(async (cuit: number) => {
      await this.supplierService.findProductsBySupplier(cuit).subscribe((data: any) => {
        this.products = data.data;
      });
    });
  }

  delete(id: string) {
    this.utils.showConfirm('Desea eliminar el producto', 'Esta acción no se puede deshacer')
      .then((result) => {
        if (result.isConfirmed) {
          this.productService.delete(id).subscribe({
            next: () => {
              this.utils.showAlert('success', 'La acción ha sido confirmada');
              this.products = this.products.filter(product => product.id !== id);
            },
            error: err => {
              console.error(err);
              this.utils.showAlert('error', 'Error al eliminar el producto', err.message);
            }
          });
        }
      });
  }

  edit(product: any): void {
    product.editName = product.name;
    product.editPrice = product.price;
    product.editStock = product.stock;
    product.editDescription = product.description;
    product.editing = true;
  }

  save(product: any): void {
    const { editName, editPrice, editStock, editDescription } = product;

    if (!this.utils.areValidFields([editName, editPrice, editStock, editDescription])) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
      return;
    }

    const hasChanged = this.utils.hasObjectChanged(
      { name: product.name, price: product.price, stock: product.stock, description: product.description },
      { name: editName, price: editPrice, stock: editStock, description: editDescription }
    );

    if (!hasChanged) {
      this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en el producto.');
      product.editing = false;
      return;
    }

    product.editName = this.utils.capitalize(editName);

    this.productService.findProductByName(product.editName).subscribe({
      next: (existingProduct: any) => {
        const nameChanged = product.name !== product.editName;
        if (existingProduct === null || !nameChanged) {
          // Aplicar cambios al objeto original
          product.name = product.editName;
          product.price = editPrice;
          product.stock = editStock;
          product.description = editDescription;

          this.productService.update(product).subscribe({
            next: () => {
              this.utils.showAlert('success', 'Producto actualizado con éxito');
              product.editing = false;
            },
            error: (err: any) => {
              console.error(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            }
          });
        } else {
          this.utils.showAlert('error', 'Error', 'El nombre ya está registrado');
        }
      },
      error: (err: any) => {
        console.error(err);
        this.utils.showAlert('error', 'Error', 'Error en la verificación del nombre.');
      }
    });
  }

  getSuppliers() {
    this.supplierService.findAll().subscribe({
      next: (data: any) => {
        this.suppliers = data.data;
      },
      error: (error) => {
        console.error('Error al obtener proveedores', error);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar los proveedores.');
      }
    });
  }

  onSupplierButtonClick(cuit: number) {
    this.filterProductsSupplierService.emitSupplierSelected(cuit);
  }

  onSupplierChange(event: any) {
    const selectedCuit = event.target.value;
    if (selectedCuit === "") {
      this.productService.findAll().subscribe((data: any) => {
        this.products = data.data;
      });
    } else {
      const cuitNumber = parseInt(selectedCuit);
      this.onSupplierButtonClick(cuitNumber);
    }
  }
}
