import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { CategoryService } from 'src/app/services/category.service';
import { SupplierService } from 'src/app/services/supplier.service';
import { Router } from "@angular/router";
import { UtilsService } from 'src/app/services/utils.service'; 

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {

  categories: any[] = [];
  suppliers: any[] = [];
  selectedImage: File | null = null;
  imagePreviewUrl: string | ArrayBuffer | null = null;
  stockMinInvalid: boolean = false;


  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private utils: UtilsService 
  ) {}

  ngOnInit(): void {
    this.getCategories();
    this.getSuppliers();
  }

  onImageSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files[0]) {
      this.selectedImage = inputElement.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      console.log('No se seleccionó ninguna imagen');
    }////
  }

  getCategories() {
    this.categoryService.findAll().subscribe({
      next: (data: any) => {
        this.categories = data.data;
      },
      error: (error) => {
        console.error('Error fetching categories', error);
      }
    });
  }

  getSuppliers() {
    this.supplierService.findAll().subscribe({
      next: (data: any) => {
        this.suppliers = data.data;
      },
      error: (error) => {
        console.error('Error fetching suppliers', error);
      }
    });
  }

  add(addForm: NgForm) {
    const newProduct = addForm.value;

    const camposObligatorios = [
      newProduct.name,
      newProduct.description,
      newProduct.price,
      newProduct.stock,
      newProduct.minimumStock,
      newProduct.category,
      newProduct.supplier
    ];

    if (!this.utils.areValidFields(camposObligatorios)) {
      this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
      return;
    }

    if (!this.utils.isValidStock(newProduct.minimumStock, newProduct.stock)) {
      this.stockMinInvalid = true;
      console.log("bandera entrando", this.stockMinInvalid);
      this.utils.showAlert('error', 'Error en el stock', 'El stock mínimo debe ser menor que el stock total.');
      return;
    }
    console.log("bandera stock sin entrar", this.stockMinInvalid);
    newProduct.name = this.utils.capitalize(newProduct.name ?? '');

    const formData = new FormData();

    Object.keys(newProduct).forEach(key => {
      formData.append(key, newProduct[key]);
    });

    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    this.productService.add(formData).subscribe({
      next: () => {
        this.utils.showAlert('success', 'Éxito', 'Producto registrado con éxito');
        addForm.resetForm();
        // Limpiar los campos de imagen
        this.selectedImage = null;
        this.imagePreviewUrl = null;
        // Limpiar el input de archivo
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        this.router.navigate(['AdminProducts']);
      },
      error: (error: any) => {
        console.error('Error al agregar el producto:', error);
        this.utils.showAlert('error', 'Error', 'No se pudo registrar el producto porque ya existe o faltan rellenar campos');
      }
    });
  }

}
