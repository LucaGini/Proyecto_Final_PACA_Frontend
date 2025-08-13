import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CityService } from '../services/city.service';
import { UtilsService } from '../services/utils.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  cities: any[] = [];
  startDate: string = '';
  endDate: string = '';
  selectedStatus: string = '';
  selectedCity: string = '';

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private cityService: CityService,
    private router: Router,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.loadCities();
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
    order.editStatus = order.status;
    order.editing = true;
  }

  save(order: any): void {
    if (!this.utils.areValidFields([order.editStatus])) {
      this.utils.showAlert('error', 'Error', 'Debe seleccionar un estado.');
      return;
    }

    if (order.status !== order.editStatus) {
      const updatedOrder = {
        ...order,
        status: order.editStatus,
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
}
