import { Component, OnInit } from '@angular/core';
import { VrpService, WeeklyRoutesResponse, Route } from 'src/app/services/vrp.service';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-vrp-list',
  templateUrl: './vrp-list.component.html',
  styleUrls: ['./vrp-list.component.scss']
})
export class VrpListComponent implements OnInit {
  weeklyRoutes: WeeklyRoutesResponse | null = null;
  selectedOrderNumbers: Set<string> = new Set();

  constructor(
    private vrpService: VrpService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.vrpService.getWeeklyRoutes().subscribe({
      next: (res: WeeklyRoutesResponse) => {
        this.weeklyRoutes = res;
      },
      error: (err) => console.error('Error cargando rutas semanales', err)
    });
  }

  getProvinces(): string[] {
    return this.weeklyRoutes?.routesByProvince
      ? Object.keys(this.weeklyRoutes.routesByProvince)
      : [];
  }

  toggleSelection(order: Route) {
  if (!order.orderId) return;
  const key = order.orderId.toString();   // usar el campo que ya viene del back
  if (this.selectedOrderNumbers.has(key)) {
    this.selectedOrderNumbers.delete(key);
  } else {
    this.selectedOrderNumbers.add(key);
  }
}


  updateSelectedOrders(newStatus: string) {
    const selectedKeys = Array.from(this.selectedOrderNumbers);
    console.log('Selected order IDs for update:', selectedKeys);

    if (selectedKeys.length === 0) {
      alert('Selecciona al menos una orden');
      return;
    }

    console.log('LO QUE LE MANDO AL BACK',selectedKeys, newStatus );
    this.orderService.bulkUpdateStatus(selectedKeys, newStatus).subscribe({
      next: () => {
        this.weeklyRoutes?.routesByProvince &&
          Object.values(this.weeklyRoutes.routesByProvince).forEach(group => {
            group.route.forEach(order => {
              if (!order.orderNumber) return;
              if (this.selectedOrderNumbers.has(order.orderNumber.toString())) {
                order.status = newStatus;
              }
            });
          });

        this.selectedOrderNumbers.clear();
      },
      error: (err) => console.error('Error al actualizar órdenes:', err)
    });
  }

  isSelected(order: Route): boolean {
    if (!order.orderNumber) return false;
    return this.selectedOrderNumbers.has(order.orderNumber.toString());
  }

  trackByRouteId(index: number, route: Route): string {
    //console.log('Tracking route:', route);
    return route.orderNumber ? route.orderNumber.toString() : index.toString();
  }
}
