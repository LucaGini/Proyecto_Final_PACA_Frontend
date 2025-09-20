import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { Router, NavigationStart } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CityService } from '../../services/city.service';
import { UtilsService } from '../../services/utils.service';
import { EditGuardService, EditingComponent } from '../../services/edit-guard.service';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit, OnDestroy, EditingComponent {
  orders: any[] = [];
  filteredOrders: any[] = [];
  cities: any[] = [];
  startDate: string = '';
  endDate: string = '';
  selectedStatus: string = '';
  selectedCity: string = '';

  // Variables para control de navegación
  private routerSubscription: Subscription = new Subscription();
  private allowNavigation = false;
  
  // Propiedades de EditingComponent
  componentName = 'order-list';

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private cityService: CityService,
    private router: Router,
    private utils: UtilsService,
    private editGuardService: EditGuardService
  ) {}

  ngOnInit() {
    // Registrar este componente en el servicio de guardia
    this.editGuardService.registerComponent(this);
    
    this.loadOrders();
    this.loadCities();
    
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
    if (this.hasOrdersInEditMode()) {
      event.preventDefault();
      event.returnValue = 'Tienes órdenes en edición. Si sales, perderás los cambios no guardados.';
    }
  }

  private setupNavigationGuard(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && !this.allowNavigation) {
        if (this.hasOrdersInEditMode()) {
          // Prevenir la navegación
          this.router.navigateByUrl(this.router.url);
          
          // Mostrar alerta de confirmación
          this.utils.showConfirm(
            'Orden en edición',
            'Estás editando una orden. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
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

  loadOrders() {
    this.orderService.findAll().subscribe({
      next: (response: any) => {
        const orderPromises = response.data.map((order: any) => {
          const productPromises = order.orderItems.map((item: any) => {
            return this.productService.findOne(item.productId).toPromise();
          });

          const cityPromise = order.user?.city 
            ? this.cityService.findOne(order.user.city).toPromise()
            : Promise.resolve(null);

          return Promise.all([...productPromises, cityPromise]).then(results => {
            const products = results.slice(0, -1);
            const city = results[results.length - 1];
            return {
              ...order,
              user: {
                ...order.user,
                cityName: city?.data?.name || city?.name || 'N/A'
              },
              orderItems: order.orderItems.map((item: any, idx: number) => ({
                ...item,
                product: products[idx],
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
      error: () => {
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

    if (this.selectedCity) {
      filtered = filtered.filter(order => order.user?.cityName === this.selectedCity);
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

    this.filteredOrders = filtered;
  }

  // Método para verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.selectedStatus !== '' || 
           this.selectedCity !== '' || 
           this.startDate !== '' || 
           this.endDate !== '';
  }

  // Método para limpiar todos los filtros
  clearAllFilters(): void {
    // Limpiar las propiedades del componente
    // Con [(ngModel)] el DOM se actualiza automáticamente
    this.selectedStatus = '';
    this.selectedCity = '';
    this.startDate = '';
    this.endDate = '';
    
    // Reaplicar filtros (mostrará todas las órdenes)
    this.applyFilters();
  }

  loadCities() {
    this.cityService.findAll().subscribe({
      next: (data: any) => {
        this.cities = data.data;
      },
      error: (error) => {
        console.error('Error al obtener ciudades', error);
      }
    });
  }

  onCityChange(event: any) {
    this.selectedCity = event.target.value;
    this.applyFilters();
  }

  edit(order: any) {
    // Verificar si ya hay alguna orden en edición
    if (this.hasOrdersInEditMode()) {
      this.utils.showAlert('warning', 'Orden en edición', 'Ya tienes una orden en modo edición. Debes guardar o cancelar los cambios antes de editar otra orden.');
      return;
    }

    order.editStatus = order.status;
    order.editing = true;
  }

  cancelEdit(order: any): void {
    order.editing = false;
  }

  save(order: any): void {
    if (!this.utils.areValidFields([order.editStatus])) {
      this.utils.showAlert('error', 'Error', 'Debe seleccionar un estado.');
      return;
    }

    if (order.status !== order.editStatus) {
      if (order.editStatus === 'rescheduled') { 
        order.rescheduleQuantity = (order.rescheduleQuantity || 0) + 1;
        if (order.rescheduleQuantity > 2) {
          order.editStatus = 'cancelled';
        }}
        
      const updatedOrder = {
        ...order,
        status: order.editStatus,
        rescheduleQuantity: order.rescheduleQuantity || 0,
        updatedDate: new Date()
      };
      console.log('Actualizando orden:', updatedOrder);

      this.orderService.update(updatedOrder).subscribe(
        () => {
          this.utils.showAlert('success', 'Orden actualizada con éxito!');
          this.productService.loadProducts();
          order.status = order.editStatus;
          order.updatedDate = new Date();
          order.editing = false;
        },
        (err: any) => {
          let errorMessage = 'No se pudo actualizar la orden.';
          if (err.status === 400) {
            errorMessage = err.error?.message || 'No se realizaron cambios en la orden.';
          }
          this.utils.showAlert('error', 'Error', errorMessage);
        }
      );
    } else {
      this.utils.showAlert('info', 'Sin cambios', 'No se realizaron cambios en la orden.');
      order.editing = false;
    }
  }

  // Métodos auxiliares para el control de edición
  private hasOrdersInEditMode(): boolean {
    return this.filteredOrders.some(order => order.editing === true);
  }

  private cancelAllEdits(): void {
    this.filteredOrders.forEach(order => {
      if (order.editing) {
        this.cancelEdit(order);
      }
    });
  }

  // Implementación de EditingComponent
  hasUnsavedChanges(): boolean {
    return this.hasOrdersInEditMode();
  }

  async handleUnsavedChanges(): Promise<boolean> {
    return this.utils.showConfirm(
      'Orden en edición',
      'Estás editando una orden. Si continúas, se perderán los cambios no guardados. ¿Deseas continuar?'
    ).then((result) => {
      if (result.isConfirmed) {
        this.cancelAllEdits();
        return true;
      }
      return false;
    });
  }
}
