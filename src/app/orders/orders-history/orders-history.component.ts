import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';

interface OrderItem {
  product: {
    name: string;
    data?: {
      name: string;
    };
  };
  productId?: {
    name: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  orderDate: Date;
  updatedDate: Date;
  total: number;
  orderItems: OrderItem[];
  user?: any;
}

@Component({
  selector: 'app-orders-history',
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.scss']
})
export class OrdersHistoryComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  startDate: string = '';
  endDate: string = '';
  selectedStatus: string = '';
  searchTerm: string = '';

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private authService: AuthService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

loadOrders() {
  const user = this.authService.getLoggedUser();
  if (!user?.email) {
    this.utils.showAlert('error', 'Error', 'Sesión no iniciada');
    return;
  }

  this.orderService.getOrdersByEmail(user.email).subscribe({
    next: (response: any) => {
      const orderPromises = response.data.map((order: any) => {
        const productPromises = order.orderItems.map((item: any) => {
          return this.productService.findOne(item.productId).toPromise()
            .then(product => {
              return product;
            });
        });

        return Promise.all(productPromises).then(products => {
          return {
            ...order,
            orderItems: order.orderItems.map((item: any, idx: number) => ({
              ...item,
              product: products[idx]?.data || products[idx], // Handle both data wrapper and direct product
              subtotal: item.quantity * item.unitPrice
            }))
          };
        });
      });

      Promise.all(orderPromises).then(processedOrders => {
        processedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        this.orders = processedOrders;
        this.filteredOrders = [...this.orders];
        this.applyFilters();
      });
    },
    error: (error) => {
      console.error('Error loading orders:', error);
      this.utils.showAlert('error', 'Error', 'No se pudieron cargar las órdenes');
    }
  });
}

  onStatusChange(event: any) {
    this.selectedStatus = event.target.value;
    this.applyFilters();
  }

  onDateChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.orders];

    if (this.selectedStatus) {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate + 'T00:00:00');
      const end = new Date(this.endDate + 'T23:59:59.999');

      start.setTime(start.getTime() + start.getTimezoneOffset() * 60 * 1000);
      end.setTime(end.getTime() + end.getTimezoneOffset() * 60 * 1000);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= start && orderDate <= end;
      });
    }

    // Filtro de búsqueda por número de orden
    if (this.searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber && 
        order.orderNumber.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    this.filteredOrders = filtered;
  }

  // Método para búsqueda de órdenes por número
  onOrderSearch(event: Event): void {
    event.preventDefault();
    
    const searchInput = (document.getElementById('order-search-input-history') as HTMLInputElement);
    const query = searchInput.value.trim();
    
    if (!query) {
      this.utils.showAlert('warning', 'Búsqueda', 'Ingrese un número de orden para buscar');
      return;
    }
    
    this.searchTerm = query;
    this.applyFilters();
  }

  // Método para validar que solo se ingresen números
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir teclas especiales: backspace (8), delete (46), tab (9), escape (27), enter (13)
    if (charCode === 8 || charCode === 46 || charCode === 9 || charCode === 27 || charCode === 13) {
      return true;
    }
    // Solo permitir números (48-57 son los códigos de 0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Método para validar el pegado de texto (solo números)
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = (event.clipboardData || (window as any).clipboardData).getData('text');
    
    // Verificar si el texto pegado contiene solo números
    if (paste && /^\d+$/.test(paste)) {
      const input = event.target as HTMLInputElement;
      input.value = paste;
    } else {
      this.utils.showAlert('warning', 'Entrada inválida', 'Solo se permiten números en la búsqueda');
    }
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    const searchInput = (document.getElementById('order-search-input-history') as HTMLInputElement);
    if (searchInput) {
      searchInput.value = '';
    }
    this.applyFilters();
  }

  // Método para verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.selectedStatus !== '' || 
           this.startDate !== '' || 
           this.endDate !== '' ||
           this.searchTerm !== '';
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    // Limpiar las propiedades del componente
    // Con [(ngModel)] el DOM se actualiza automáticamente
    this.selectedStatus = '';
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    
    // Limpiar también el input de búsqueda
    const searchInput = (document.getElementById('order-search-input-history') as HTMLInputElement);
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Reaplicar filtros (mostrará todas las órdenes)
    this.applyFilters();
  }

  cancelOrder(order: Order) {
    this.utils.showConfirm('¿Estás seguro?', 'Esta acción cancelará la orden y no se podrá revertir.')
    .then((result) => {
      if (result.isConfirmed) {
        const updatedOrder = {
          ...order,
          status: 'cancelled',
          updatedDate: new Date(),
          orderItems: order.orderItems 
        };
  
        this.orderService.update(updatedOrder).subscribe({
          next: () => {
            this.utils.showAlert('success', 'Cancelado', 'La orden ha sido cancelada con éxito');
            order.status = 'cancelled';
            order.updatedDate = new Date();
            this.productService.loadProducts();  
          },
          
          error: (error) => {
            let errorMessage = 'No se pudo cancelar la orden.';
            if (error.status === 400 && error.error?.message) {
              errorMessage = error.error.message; // esto es lo que dice el back
         }
         this.utils.showAlert('error', 'Error', errorMessage);
          }
        });
      }
    });
  }
}