import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { SupplierService } from 'src/app/services/supplier.service';
import { FilterProductsSupplierService } from 'src/app/services/filters/filter-products-supplier.service';
import { CategoryService } from 'src/app/services/category.service';
import { FilterProductsCategoryService } from 'src/app/services/filters/filter-products-category.service';
import { environment } from '../../../environments/environment';
import { UtilsService } from 'src/app/services/utils.service';
import { EditGuardService, EditingComponent } from 'src/app/services/edit-guard.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-list-products',
  templateUrl: './edit-list-products.component.html',
  styleUrls: ['./edit-list-products.component.scss']
})
export class EditListProductsComponent implements OnDestroy, EditingComponent {
  products: any[] = [];
  allProducts: any[] = []; // Nueva propiedad para mantener todos los productos
  suppliers: any[] = [];
  categories: any[] = [];
  apiUrl = environment.apiUrl;
  
  // Variables para mantener el estado de los filtros
  selectedSupplierCuit: number | string = '';
  selectedCategoryName: string = '';
  selectedStatus: boolean | string = '';
  
  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'edit-list-products';

  getImageUrl(imageUrl: string): string {
    // Si la imagen ya es una URL completa (Cloudinary), la retornamos tal como está
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    // Si no, concatenamos con la apiUrl para imágenes locales
    return this.apiUrl + imageUrl;
  }

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private supplierService: SupplierService,
    private filterProductsSupplierService: FilterProductsSupplierService,
    private categoryService: CategoryService,
    private filterProductsCategoryService: FilterProductsCategoryService,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    this.getSuppliers();
    this.getCategories();
    
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    // Cargar todos los productos inicialmente
    this.productService.products$.subscribe((data: any) => {
      this.allProducts = data;
      this.applyFilters(); // Aplicar filtros cada vez que se actualicen los productos
    });

    // Escuchar cambios en el filtro de proveedor
    this.filterProductsSupplierService.supplierSelected$.subscribe((cuit: number) => {
      this.selectedSupplierCuit = cuit;
      this.applyFilters();
    });

    // Escuchar cambios en el filtro de categoría
    this.filterProductsCategoryService.categorySelected$.subscribe((categoryName: string) => {
      this.selectedCategoryName = categoryName;
      this.applyFilters();
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
    if (this.hasProductsInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes productos en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasProductsInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Producto en edición',
            'Estás editando un producto. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
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

  delete(id: string) {
    this.utils.showConfirm('Desea eliminar el producto', 'Esta acción no se puede deshacer')
      .then((result) => {
        if (result.isConfirmed) {
          this.productService.delete(id).subscribe({
            next: () => {
              this.utils.showAlert('success', 'La acción ha sido confirmada');
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
    // Verificar si ya hay algún producto en edición
    if (this.hasProductsInEditMode()) {
      this.utils.showAlert('warning', 'Producto en edición', 'Ya tienes un producto en modo edición. Debes guardar o cancelar los cambios antes de editar otro producto.');
      return;
    }

    product.editName = product.name;
    product.editPrice = product.price;
    product.editStock = product.stock;
    product.editMinimumStock = product.minimumStock;
    product.editDescription = product.description;
    product.editing = true;
    // Agregar propiedades para el manejo de imagen
    product.selectedImage = null;
    product.imagePreviewUrl = null;
    product.hasNewImage = false;
  }

  onImageSelected(event: Event, product: any) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files[0]) {
      product.selectedImage = inputElement.files[0];
      product.hasNewImage = true;
      const reader = new FileReader();
      reader.onload = () => {
        product.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(product.selectedImage);
    } else {
      console.log('No se seleccionó ninguna imagen');
    }
  }

  cancelEdit(product: any): void {
    product.editing = false;
    product.selectedImage = null;
    product.imagePreviewUrl = null;
    product.hasNewImage = false;
  }

save(product: any): void {
  const { editName, editPrice, editStock, editMinimumStock, editDescription } = product;

  if (!this.utils.areValidFields([editName, editPrice, editStock, editMinimumStock, editDescription])) {
    this.utils.showAlert('error', 'Error en el registro', 'Debe completar todos los campos.');
    return;
  }

  const hasChanged = this.utils.hasObjectChanged(
    { name: product.name, price: product.price, stock: product.stock, minimumStock: product.minimumStock, description: product.description },
    { name: editName, price: editPrice, stock: editStock, minimumStock: editMinimumStock, description: editDescription }
  );

  // Verificar si hay cambios o si hay una nueva imagen
  if (!hasChanged && !product.hasNewImage) {
    this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en el producto.');
    product.editing = false;
    return;
  }

  product.editName = this.utils.capitalize(editName);

  this.productService.findProductByName(product.editName).subscribe({
    next: (existingProduct: any) => {
      const nameChanged = product.name !== product.editName;
      if (existingProduct === null || !nameChanged) {
        
        // Crear el objeto con los datos actualizados
        const updatedProduct = {
          id: product.id,
          name: product.editName,
          price: parseFloat(editPrice),
          stock: parseInt(editStock),
          minimumStock: parseInt(editMinimumStock),
          description: editDescription,
          isActive: product.isActive,
          category: product.category,
          supplier: product.supplier
        };

        // Si hay nueva imagen, usar el método updateWithImage, sino usar update normal
        if (product.hasNewImage && product.selectedImage) {
          this.productService.updateWithImage(updatedProduct, product.selectedImage).subscribe({
            next: (res: any) => {
              if (res.data) {
                const index = this.products.findIndex(p => p.id === res.data.id);
                if (index !== -1) {
                  this.products[index] = res.data;
                  this.products = [...this.products]; // Forzar renderizado
                }
              }
              this.utils.showAlert('success', 'Producto actualizado con éxito');
              product.editing = false;
              // Limpiar propiedades de imagen
              product.selectedImage = null;
              product.imagePreviewUrl = null;
              product.hasNewImage = false;
            },
            error: (err: any) => {
              console.error(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            }
          });
        } else {
          this.productService.update(updatedProduct).subscribe({
            next: (res: any) => {
              if (res.data) {
                const index = this.products.findIndex(p => p.id === res.data.id);
                if (index !== -1) {
                  this.products[index] = res.data;
                  this.products = [...this.products]; // Forzar renderizado
                }
              }
              this.utils.showAlert('success', 'Producto actualizado con éxito');
              product.editing = false;
            },
            error: (err: any) => {
              console.error(err);
              this.utils.showAlert('error', 'Registro fallido', err.message);
            }
          });
        }
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

  getCategories() {
    this.categoryService.findAll().subscribe({
      next: (data: any) => {
        this.categories = data.data;
      },
      error: (error) => {
        console.error('Error al obtener categorías', error);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las categorías.');
      }
    });
  }

  // Método para aplicar filtros combinados
  applyFilters() {
    let filteredProducts = [...this.allProducts];

    // Aplicar filtro de proveedor si está seleccionado
    if (this.selectedSupplierCuit !== '' && this.selectedSupplierCuit !== null) {
      const selectedSupplier = this.suppliers.find(supplier => supplier.cuit === this.selectedSupplierCuit);
      if (selectedSupplier) {
        filteredProducts = filteredProducts.filter(product => 
          product.supplier === selectedSupplier.id
        );
      }
    }

    // Aplicar filtro de categoría si está seleccionado
    if (this.selectedCategoryName !== '' && this.selectedCategoryName !== null) {
      const selectedCategory = this.categories.find(category => category.name === this.selectedCategoryName);
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === selectedCategory.id
        );
      }
    }

    // Aplicar filtro de estado si está seleccionado
    if (this.selectedStatus !== '' && this.selectedStatus !== null) {
      filteredProducts = filteredProducts.filter(product => 
        product.isActive === this.selectedStatus
      );
    }

    this.products = filteredProducts;
  }

  // Método para verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.selectedSupplierCuit !== '' && this.selectedSupplierCuit !== null || 
           (this.selectedCategoryName !== '' && this.selectedCategoryName !== null) || 
           this.selectedStatus !== '' && this.selectedStatus !== null;
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    // Limpiar las propiedades del componente
    // Con [(ngModel)] el DOM se actualiza automáticamente
    this.selectedSupplierCuit = '';
    this.selectedCategoryName = '';
    this.selectedStatus = '';
    
    // Reaplicar filtros (mostrará todos los productos)
    this.applyFilters();
  }

  onSupplierButtonClick(cuit: number) {
    this.filterProductsSupplierService.emitSupplierSelected(cuit);
  }

  onCategoryButtonClick(categoryName: string) {
    this.filterProductsCategoryService.emitCategorySelected(categoryName);
  }

  onSupplierChange(event: any) {
    const selectedCuit = event.target.value;
    if (selectedCuit === "") {
      this.selectedSupplierCuit = '';
    } else {
      this.selectedSupplierCuit = parseInt(selectedCuit);
    }
    this.applyFilters();
  }

  onCategoryChange(event: any) {
    const selectedCategory = event.target.value;
    if (selectedCategory === "") {
      this.selectedCategoryName = '';
    } else {
      this.selectedCategoryName = selectedCategory;
    }
    this.applyFilters();
  }

  onStatusChange(event: any) {
    const selectedStatus = event.target.value;
    if (selectedStatus === "") {
      this.selectedStatus = '';
    } else {
      this.selectedStatus = selectedStatus === "true";
    }
    this.applyFilters();
  }

  showLowStockAlert(product: any): void {
  this.supplierService.findOne(product.supplier).subscribe({
    next: (data: any) => {
      if (!data || !data.data) {
        this.utils.showAlert('error', 'Error', 'No se encontró el proveedor.');
        return;
      }

      const supplier = data.data;

      this.utils.showConfirm(
        `Tienes poco stock del producto "${product.name}".`,
        `¿Quieres enviar un mail a tu proveedor ${supplier.businessName} a ${supplier.email} solicitando nuevo stock?`
      ).then((result) => {
        if (result.isConfirmed) {
          this.supplierService.requestRestockEmail(product.id, supplier.id).subscribe({
            next: (res: any) => {
              if (res.data) {
                // Reemplazar en la lista el producto que cambió
                const index = this.products.findIndex(p => p.id === res.data.id);
                if (index !== -1) {
                  this.products[index] = res.data;
                  this.products = [...this.products]; // forzar renderizado
                }
              }
              this.utils.showAlert('success', 'Éxito', 'Correo enviado al proveedor correctamente');
            },
            error: () => {
              this.utils.showAlert('error', 'Error', 'No se pudo enviar el correo');
            }
          });
        }
      });
    },
    error: () => {
      this.utils.showAlert('error', 'Error', 'No se pudo obtener el proveedor');
    }
  });
}

reactivate(product: any) {
  console.log('Reactivating product:', product.id);
  this.productService.reactivateProduct(product.id).subscribe({
    next: () => {
      this.utils.showAlert('success', 'Producto reactivado', `El producto ${product.name} ha sido reactivado.`);
      product.isActive = true;  // Actualiza el estado en UI
    },
    error: (err) => {
      this.utils.showAlert('error', 'Error', 'No se pudo reactivar el producto.');
      console.error(err);
    }
  });
}

// Métodos auxiliares para el control de edición
private hasProductsInEditMode(): boolean {
  return this.products.some(product => product.editing === true);
}

private cancelAllEdits(): void {
  this.products.forEach(product => {
    if (product.editing) {
      this.cancelEdit(product);
    }
  });
}

// Implementación de EditingComponent
hasUnsavedChanges(): boolean {
  return this.hasProductsInEditMode();
}

async handleUnsavedChanges(): Promise<boolean> {
  return this.utils.showConfirm(
    'Producto en edición',
    'Estás editando un producto. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
  ).then((result) => {
    if (result.isConfirmed) {
      this.cancelAllEdits();
      return true;
    }
    return false;
  });
}

}