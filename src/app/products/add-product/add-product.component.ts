import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ProductService } from 'src/app/services/product.service';
import { CategoryService } from 'src/app/services/category.service';
import { SupplierService } from 'src/app/services/supplier.service';
import { Router } from "@angular/router";
import Swal from 'sweetalert2';

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

  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
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
    }
  }
  
  getCategories(){
    this.categoryService.findAll().subscribe(
      (data: any) => {
        this.categories = data.data;
      },
      (error) => {
        console.error('Error fetching categories', error);
      }
    );
  }

  getSuppliers(){
    this.supplierService.findAll().subscribe(
      (data: any) => {
        this.suppliers = data.data;
      },
      (error) => {
        console.error('Error fetching suppliers', error);
      }
    );
  }

  add(addForm: NgForm) {  
    if (addForm.invalid) {
      Swal.fire('Error', 'Por favor, complete todos los campos requeridos', 'error');
      return;
    }

    const formData = new FormData();
    const newProduct = addForm.value;

    // Añadir cada campo del formulario al FormData
    Object.keys(newProduct).forEach(key => {
      formData.append(key, newProduct[key]);
    });

    // Añadir la imagen si se seleccionó una
    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    this.productService.add(formData).subscribe(
      (response: any) => {
        Swal.fire('Éxito', 'Producto registrado con éxito', 'success');
        addForm.resetForm();
        this.router.navigate(['AdminProducts']);
      },
      (error: any) => {
        console.error('Error al agregar el producto:', error);
        Swal.fire('Error', 'No se pudo registrar el producto porque ya existe o faltan rellenar campos', 'error');
      }
    );
  }
}