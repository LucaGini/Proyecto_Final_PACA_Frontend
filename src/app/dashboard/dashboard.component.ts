import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, ProvinceSales, TopProduct, TopCustomer } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  readonly panelOpenState = signal(false);

  startDate: string = '';
  endDate: string = '';
  selectedProvince: string = '';
  selectedCategory: string = '';

  ///VETAS///

  // Ventas por provincia
  salesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Provincia', data: [] }] };
  salesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Ventas por ciudad
  citiesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  citiesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Categoraas
  categoriesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Categoría', data: [] }] };
  categoriesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  //Productos por categoria
  productsByCategoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  productsByCategoryChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Ganancias a lo largo del tiempo
  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'line'> = { responsive: true };

  ///PRODUCTOS///

  // Top productos
  topProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Productos', data: [] }] };
  topProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Peores productos
  worstProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Peores Productos', data: [] }] };
  worstProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  ///CLIENTES ///

  // Top clientes
  topCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Clientes', data: [] }] };
  topCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Peores clientes
  worstCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Peores 5 Clientes', data: [] }] };
  worstCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  /// ORDENES ///
  // Torta de estado de órdenes
  orderStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  orderStatusChartOptions: ChartOptions<'doughnut'> = { responsive: true };

  

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCharts();
  }

  onDateChange() {
    if (this.startDate && this.endDate) {
      this.loadCharts();
      
      if (this.selectedProvince) {
        this.loadSalesByCity(this.selectedProvince);
      }
      
      if (this.selectedCategory) {
        this.loadProductsByCategory(this.selectedCategory);
      }
    }
  }

  onProvinceClick(event: any) {
    if (event.active && event.active.length > 0) {
      const chartElement = event.active[0];
      const province = this.salesChartData.labels?.[chartElement.index] as string;

      if (province) {
        this.selectedProvince = province;
        this.loadSalesByCity(province);
      }
    }
  }

  loadSalesByCity(province: string) {
    this.dashboardService.getSalesByCity(province, this.startDate, this.endDate).subscribe(res => {
      const data = res.data;
      this.citiesChartData = {
        labels: data.map((d: any) => d.city),
        datasets: [{
          label: `Ventas en ${province}`,
          data: data.map((d: any) => d.totalSales),
          backgroundColor: ['#b38558']
        }]
      };
      this.cdr.markForCheck();
    });
  }

  onCategoryClick(event: any) {
    if (event.active && event.active.length > 0) {
      const chartElement = event.active[0];
      const category = this.categoriesChartData.labels?.[chartElement.index] as string;

      if (category) {
        this.selectedCategory = category;
        this.loadProductsByCategory(category);
      }
    }
  }

  loadProductsByCategory(category: string) {
    this.dashboardService.getProductsByCategory(category, this.startDate, this.endDate).subscribe(res => {
      const data = res.data;
      this.productsByCategoryChartData = {
        labels: data.map((d: any) => d.name),
        datasets: [{
          label: `Productos en ${category}`,
          data: data.map((d: any) => d.totalSold),
          backgroundColor: ['#b38558']
        }]
      };
      this.cdr.markForCheck();
    });
  }

  loadCharts() {
    const start = this.startDate;
    const end = this.endDate;

    // Ventas por provincia
    this.dashboardService.getSalesByProvince(start, end).subscribe(res => {
      const data: ProvinceSales[] = res.data;
      this.salesChartData = {
        labels: data.map(d => d.province),
        datasets: [{
          label: 'Ventas por Provincia',
          data: data.map(d => d.totalSales),
          backgroundColor: ['#6b8e23']
        }]
      };
      this.cdr.markForCheck();
    });

    // Ventas por categoría
    this.dashboardService.getSalesByCategory(start, end).subscribe(res => {
      const data = res.data;
      this.categoriesChartData = {
        labels: data.map((d: any) => d.category),
        datasets: [{
          label: 'Ventas por Categoría',
          data: data.map((d: any) => d.totalSales),
          backgroundColor: ['#F4E3C1']
        }]
      };
      this.cdr.markForCheck();
    });

    // Ganancias en el tiempo
    this.dashboardService.getRevenueOverTime(start, end).subscribe(res => {
      this.revenueChartData = {
        labels: res.data.map((x: any) => new Date(x.date).toLocaleDateString()),
        datasets: [{
          label: 'Ingresos',
          data: res.data.map((x: any) => x.revenue),
          borderColor:'#b38558',
          tension: 0.2
        }]
      };
      this.cdr.markForCheck();
    });


    // Top productos
    this.dashboardService.getTopProducts(start, end).subscribe(res => {
      const data: TopProduct[] = res.data;
      this.topProductsChartData = {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Unidades Vendidas',
          data: data.map(d => d.totalSold),
          backgroundColor: ['#F4E3C1']
        }]
      };
      this.cdr.markForCheck();
    });

    // Peores productos
    this.dashboardService.getWorstProducts(start, end).subscribe(res => {
      const data: any[] = res.data;
      this.worstProductsChartData = {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Unidades Vendidas',
          data: data.map(d => d.totalSold),
          backgroundColor: ['#c94c4c']
        }]
      };
      this.cdr.markForCheck();
    });

    // Top clientes
    this.dashboardService.getTopCustomers(start, end).subscribe(res => {
      const data: TopCustomer[] = res.data;
      this.topCustomersChartData = {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Total compra cliente',
          data: data.map(d => d.totalSpent),
          backgroundColor: ['#F4E3C1']
        }]
      };
      this.cdr.markForCheck();
    });

    // Peores clientes
    this.dashboardService.getWorstCustomers(start, end).subscribe(res => {
      const data: any[] = res.data;
      this.worstCustomersChartData = {
        labels: data.map(d => d.name ?? 'Usuario desconocido'),
        datasets: [{
          label: 'Total de órdenes canceladas',
          data: data.map(d => d.totalCancelled),
          backgroundColor: ['#b38558']
        }]
      };
      this.cdr.markForCheck();
    });

    // Órdenes por estado
    this.dashboardService.getOrderStatusSummary(start, end).subscribe(res => {
      this.orderStatusChartData = {
        labels: ['Completadas', 'Pendientes', 'Canceladas'],
        datasets: [{
          data: [res.data.completed, res.data.pending, res.data.cancelled],
          backgroundColor: ['#6b8e23','#ffd700', '#c94c4c']
        }]
      };
      this.cdr.markForCheck();
    });


  }
}
