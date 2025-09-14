import { Component, OnInit } from '@angular/core';
import { VrpService, WeeklyRoutesResponse, Route } from 'src/app/services/vrp.service';
import { OrderService } from 'src/app/services/order.service';
import { UtilsService } from 'src/app/services/utils.service';

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
    private orderService: OrderService,
    private utils: UtilsService 
  ) {}

  ngOnInit() {
    this.vrpService.getWeeklyRoutes().subscribe({
      next: (res: WeeklyRoutesResponse) => {
        this.weeklyRoutes = res;
      },
      error: (err) => {
        console.error('Error cargando rutas semanales', err);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las rutas semanales');
      }
    });
  }

  getProvinces(): string[] {
    return this.weeklyRoutes?.routesByProvince
      ? Object.keys(this.weeklyRoutes.routesByProvince)
      : [];
  }

  toggleSelection(order: Route) {
    if (!order.orderId) return;
    const key = order.orderId.toString();
    if (this.selectedOrderNumbers.has(key)) {
      this.selectedOrderNumbers.delete(key);
    } else {
      this.selectedOrderNumbers.add(key);
    }
  }

  updateSelectedOrders(newStatus: string) {
    const selectedKeys = Array.from(this.selectedOrderNumbers);
    if (selectedKeys.length === 0) {
      this.utils.showAlert('warning', 'Atención', 'Selecciona al menos una orden');
      return;
    }

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

        this.utils.showAlert('success', 'Órdenes actualizadas con éxito!');
        this.selectedOrderNumbers.clear();
      },
      error: (err) => {
        console.error('Error al actualizar órdenes:', err);
        this.utils.showAlert('error', 'Error', 'No se pudieron actualizar las órdenes');
      }
    });
  }

  isSelected(order: Route): boolean {
    if (!order.orderNumber) return false;
    return this.selectedOrderNumbers.has(order.orderNumber.toString());
  }

  trackByRouteId(index: number, route: Route): string {
    return route.orderNumber ? route.orderNumber.toString() : index.toString();
  }
}
