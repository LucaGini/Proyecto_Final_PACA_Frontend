import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from 'src/app/services/product.service';
import { Router } from '@angular/router';
import { SupplierService } from 'src/app/services/supplier.service';
import { FilterProductsSupplierService } from 'src/app/services/filters/filter-products-supplier.service';
import { CategoryService } from 'src/app/services/category.service';
import { FilterProductsCategoryService } from 'src/app/services/filters/filter-products-category.service';
import { environment } from '../../../environments/environment';
import { UtilsService } from 'src/app/services/utils.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-edit-list-products',
  templateUrl: './edit-list-products.component.html',
  styleUrls: ['./edit-list-products.component.scss']
})
export class EditListProductsComponent {
  products: any[] = [];
  allProducts: any[] = []; // Nueva propiedad para mantener todos los productos
  suppliers: any[] = [];
  categories: any[] = [];
  apiUrl = environment.apiUrl;
  
  // Variables para mantener el estado de los filtros
  selectedSupplierCuit: number | null = null;
  selectedCategoryName: string | null = null;

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
    private utils: UtilsService
  ) {}

  ngOnInit() {
  this.getSuppliers();
  this.getCategories();
  this.loadProducts();
  
  // Cargar todos los productos, activos e inactivos
  // this.productService.findAll().subscribe({
  //   next: (res: any) => {
  //     this.allProducts = res.data; // guardamos todos
  //     this.applyFilters();         // aplicamos los filtros si hubiera
  //   },
  //   error: (err) => {
  //     console.error('Error al cargar productos', err);
  //   }
  // });

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
  }

  loadProducts() {
  this.productService.findAll().subscribe({
    next: (res: any) => {
      this.allProducts = res.data;
      this.applyFilters();
    },
    error: (err) => {
      console.error('Error loading products:', err);
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
              this.loadProducts();
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
    product.editMinimumStock = product.minimumStock;
    product.editDescription = product.description;
    product.editing = true;
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
        product.minimumStock = editMinimumStock;
        product.description = editDescription;

        this.productService.update(product).subscribe({
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
            this.loadProducts();
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
    if (this.selectedSupplierCuit !== null) {
      const selectedSupplier = this.suppliers.find(supplier => supplier.cuit === this.selectedSupplierCuit);
      if (selectedSupplier) {
        filteredProducts = filteredProducts.filter(product => 
          product.supplier === selectedSupplier.id
        );
      }
    }

    // Aplicar filtro de categoría si está seleccionado
    if (this.selectedCategoryName !== null && this.selectedCategoryName !== '') {
      const selectedCategory = this.categories.find(category => category.name === this.selectedCategoryName);
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === selectedCategory.id
        );
      }
    }

    this.products = filteredProducts;
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
      this.selectedSupplierCuit = null;
    } else {
      this.selectedSupplierCuit = parseInt(selectedCuit);
    }
    this.applyFilters();
  }

  onCategoryChange(event: any) {
    const selectedCategory = event.target.value;
    if (selectedCategory === "") {
      this.selectedCategoryName = null;
    } else {
      this.selectedCategoryName = selectedCategory;
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
reActive(productId: string) {
  console.log('Reactivating product with ID:', productId);
    this.productService.reActivate(productId).subscribe({
      next: () => {
        this.loadProducts(); // recarga la lista
      },
      error: (err) => {
        console.error('Error reactivating product:', err);
      }
    });
  }
}