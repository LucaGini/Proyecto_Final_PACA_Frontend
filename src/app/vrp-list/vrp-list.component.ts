import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-vrp-list',
  templateUrl: './vrp-list.component.html',
  styleUrls: ['./vrp-list.component.scss']
})
export class VrpListComponent implements OnInit {
  ordersInDistribution: any[] = [];
  routesByProvince: { [province: string]: any[] } = {};
  selectedOrderNumbers: Set<string> = new Set();

  constructor(
    private orderService: OrderService,
    private utils: UtilsService
  ) {}

  ngOnInit() {
    this.loadOrdersInDistribution();
  }

  private loadOrdersInDistribution() {
    this.orderService.findInDistribution().subscribe({
      next: (res) => {
        this.ordersInDistribution = res.data;
        this.routesByProvince = this.groupByProvince(this.ordersInDistribution);
        console.log('Órdenes en distribución cargadas:', this.ordersInDistribution);
      },
      error: (err) => {
        console.error('Error cargando órdenes en distribución', err);
        this.utils.showAlert('error', 'Error', 'No se pudieron cargar las órdenes en distribución');
      }
    });
  }

  private groupByProvince(orders: any[]): { [province: string]: any[] } {
    return orders.reduce((acc, order) => {
      const province = order.province || 'Sin provincia';
      if (!acc[province]) acc[province] = [];
      acc[province].push(order);
      return acc;
    }, {} as { [province: string]: any[] });
  }

  getProvinces(): string[] {
    return Object.keys(this.routesByProvince);
  }

  toggleSelection(order: any, event: Event) {
    if (!order.id) return;
    const key = order.id.toString();
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedOrderNumbers.add(key);
    } else {
      this.selectedOrderNumbers.delete(key);
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
        // Filtramos las órdenes actualizadas y reagrupamos
        this.ordersInDistribution = this.ordersInDistribution.filter(
          order => !this.selectedOrderNumbers.has(order.id.toString())
        );
        this.routesByProvince = this.groupByProvince(this.ordersInDistribution);

        this.utils.showAlert('success', 'Órdenes actualizadas con éxito!');
        this.selectedOrderNumbers.clear();
      },
      error: (err) => {
        console.error('Error al actualizar órdenes:', err);
        this.utils.showAlert('error', 'Error', 'No se pudieron actualizar las órdenes');
      }
    });
  }

  isSelected(order: any): boolean {
    if (!order.id) return false;
    return this.selectedOrderNumbers.has(order.id.toString());
  }

  trackByOrderId(index: number, order: any): string {
    return order.id ? order.id.toString() : index.toString();
  }
}
