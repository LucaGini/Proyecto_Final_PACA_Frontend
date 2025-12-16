import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, ProvinceSales, TopProduct, TopCustomer } from '../services/dashboard.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  @ViewChildren('chartCard', { read: ElementRef }) chartCardElements!: QueryList<ElementRef<HTMLElement>>;

  selectedSection: 'ventas' | 'ordenes' | 'clientes' = 'ventas';
  isLoading = signal(false);
  totalRevenue: number = 0;

  // Para tooltip global que usa el endpoint que devuelve breakdown por día
  orderStatusPerDay: any[] = [];

  // Para orders per day
  ordersPerDayChartData: ChartData<'line'> = { labels: [], datasets: [] };
  ordersPerDayChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          afterBody: (context: any) => {
            const idx = context[0]?.dataIndex ?? 0;
            const day = this.orderStatusPerDay[idx];
            if (!day) return [];
            return [
              `Pendientes: ${day.pending ?? 0}`,
              `Completadas: ${day.completed ?? 0}`,
              `Canceladas: ${day.cancelled ?? 0}`, 
              ...(day.rescheduled != null ? [`Reenviadas: ${day.rescheduled}`] : [])
            ];
          }
        }
      }
    }
  };

  // Guardamos las fechas raw (YYYY-MM-DD) para cada punto, para poder pedir detalle por fecha
  private ordersPerDayRawDates: string[] = [];

  // Estado seleccionado al hacer click en un día
  selectedDay: string | null = null; // YYYY-MM-DD
  selectedDayStatus: { pending: number; completed: number; cancelled: number; rescheduled: number } | null = null;

  // -- Resto de charts (sin cambios funcionales, pero declarados para mantener compatibilidad) --
  salesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Provincia', data: [] }] };
  salesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };
  citiesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  citiesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };
  categoriesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Categoría', data: [] }] };
  categoriesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };
  productsByCategoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  productsByCategoryChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };
  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'line'> = { responsive: true };
  topProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Productos', data: [] }] };
  topProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };
  worstProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Peores Productos', data: [] }] };
  worstProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };
  topCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Clientes', data: [] }] };
  topCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };
  worstCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Peores 5 Clientes', data: [] }] };
  worstCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };
  orderStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  orderStatusChartOptions: ChartOptions<'doughnut'> = { responsive: true };

  readonly panelOpenState = signal(false);

  // Fechas / filtros
  startDate: string = '';
  endDate: string = '';
  selectedProvince: string = '';
  selectedCategory: string = '';

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void { /* no-op */ }

  ngOnInit(): void {
    this.loadCharts();
  }

  // --- Helpers ---
  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  hasActiveFilters(): boolean {
    return !!(this.startDate || this.endDate || this.selectedProvince || this.selectedCategory);
  }

  private hasData(chart: ChartData<any>): boolean {
    return (chart && chart.datasets && chart.datasets.some((ds: any) =>
      Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v != null)
    ));
  }

  get hasAnyChartData(): boolean {
    const charts = [
      this.topProductsChartData,
      this.worstProductsChartData,
      this.salesChartData,
      this.citiesChartData,
      this.categoriesChartData,
      this.productsByCategoryChartData,
      this.topCustomersChartData,
      this.worstCustomersChartData,
      this.orderStatusChartData,
      this.ordersPerDayChartData,
      this.revenueChartData
    ];
    const hasData = (chart: any) =>
      chart && chart.datasets && chart.datasets.some((ds: any) =>
        Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v !== null && v !== undefined)
      );
    return charts.some(hasData);
  }

  get isDateRangeEmpty(): boolean {
    return !this.startDate || !this.endDate;
  }

  get noChartData(): boolean {
    return !this.hasAnyChartData && !this.isDateRangeEmpty;
  }

  get noChartDataVentas(): boolean {
    return (
      !this.hasData(this.topProductsChartData) &&
      !this.hasData(this.worstProductsChartData) &&
      !this.hasData(this.salesChartData) &&
      !this.hasData(this.citiesChartData) &&
      !this.hasData(this.categoriesChartData) &&
      !this.hasData(this.productsByCategoryChartData)
    );
  }

  get noChartDataOrdenes(): boolean {
    return !this.hasData(this.orderStatusChartData) && !this.hasData(this.ordersPerDayChartData);
  }

  get noChartDataClientes(): boolean {
    return (
      !this.hasData(this.topCustomersChartData) &&
      !this.hasData(this.worstCustomersChartData)
    );
  }

  // --- Interacciones / filtros ---
  onDateChange() {
    this.loadCharts();
    if (this.selectedProvince) this.loadSalesByCity(this.selectedProvince);
    if (this.selectedCategory) this.loadProductsByCategory(this.selectedCategory);
  }

  clearAllFilters() {
    this.startDate = '';
    this.endDate = '';
    this.selectedProvince = '';
    this.selectedCategory = '';
    this.loadCharts();
  }

  onProvinceClick(event: any) {
    if (event.active && event.active.length > 0) {
      const chartElement = event.active[0];
      const province = this.salesChartData.labels?.[chartElement.index] as string;
      if (province) {
        this.selectedProvince = province;
        this.loadSalesByCity(province);
      }
    } else {
      this.selectedProvince = '';
      this.citiesChartData = { labels: [], datasets: [] };
    }
  }

  onCategoryClick(event: any) {
    if (event.active && event.active.length > 0) {
      const chartElement = event.active[0];
      const category = this.categoriesChartData.labels?.[chartElement.index] as string;
      if (category) {
        this.selectedCategory = category;
        this.loadProductsByCategory(category);
      }
    } else {
      this.selectedCategory = '';
      this.productsByCategoryChartData = { labels: [], datasets: [] };
    }
  }

  // --- Loads (sales, products, customers, etc.) ---
  loadSalesByCity(province: string) {
    this.dashboardService.getSalesByCity(province, this.startDate, this.endDate)
      .subscribe((res) => {
        const data = res.data || [];
        this.citiesChartData = {
          labels: data.map((d: any) => d.city),
          datasets: [
            {
              label: `Ventas en ${province}`,
              data: data.map((d: any) => d.totalSales),
              backgroundColor: '#b38558',
              borderColor: '#b38558',
              borderWidth: 1
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  loadProductsByCategory(category: string) {
    this.dashboardService.getProductsByCategory(category, this.startDate, this.endDate)
      .subscribe((res) => {
        const data = res.data || [];
        this.productsByCategoryChartData = {
          labels: data.map((d: any) => d.name),
          datasets: [
            {
              label: `Productos en ${category}`,
              data: data.map((d: any) => d.totalSold),
              backgroundColor: '#c94c4c',
              borderColor: '#c94c4c',
              borderWidth: 1
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  // PDF export (igual que tenías, con marca de cambio)
  async downloadPDF() {
    this.isLoading.set(true);
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const img = new Image();
      img.src = 'assets/img/paca-logo.png';

      this.cdr.detectChanges();
      await new Promise((r) => setTimeout(r, 250));

      const cards = this.chartCardElements ? this.chartCardElements.toArray() : [];
      let pageNum = 1;

      for (let i = 0; i < cards.length; i++) {
        const elRef = cards[i];
        const el = elRef.nativeElement as HTMLElement;
        if (!el.offsetParent) continue;

        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgWidth = pageWidth - 80;
        let imgHeight = canvas.height * (imgWidth / canvas.width);

        if (imgHeight > pageHeight - 120) {
          imgHeight = pageHeight - 120;
          imgWidth = canvas.width * (imgHeight / canvas.height);
        }

        pdf.addImage(img, 'PNG', 20, 15, 40, 40);
        pdf.setFontSize(18);
        pdf.text('Dashboard Completo', pageWidth / 2, 35, { align: 'center' });
        pdf.addImage(imgData, 'PNG', 40, 70, imgWidth, imgHeight);

        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Generado el ${new Date().toLocaleDateString()}`, 40, pageHeight - 20);
        pdf.text(`Página ${pageNum}`, pageWidth - 80, pageHeight - 20);

        if (i < cards.length - 1) pdf.addPage();
        pageNum++;
      }

      const today = new Date().toISOString().split('T')[0];
      const range = (this.startDate && this.endDate) ? `_${this.startDate}_a_${this.endDate}` : '';
      pdf.save(`Dashboard_${today}${range}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  // --- Carga todas las gráficas (central) ---
  loadCharts() {
    const starless = this.startDate ? new Date(this.startDate) : null;
    const endless = this.endDate ? new Date(this.endDate) : null;

    // const startPlus1 = starless ? new Date(starless.getTime() + 24 * 60 * 60 * 1000) : null;
    // const endPlus1 = endless ? new Date(endless.getTime() + 24 * 60 * 60 * 1000) : null;

    const start = this.startDate;
    const end   = this.endDate;


    // Sales by province
    this.dashboardService.getSalesByProvince(start, end).subscribe((res) => {
      const data: ProvinceSales[] = res.data || [];
      this.salesChartData = {
        labels: data.map((d) => d.province),
        datasets: [
          {
            label: 'Ventas por Provincia',
            data: data.map((d) => d.totalSales),
            backgroundColor: '#6b8e23',
            borderColor: '#6b8e23',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Sales by category
    this.dashboardService.getSalesByCategory(start, end).subscribe((res) => {
      const data = res.data || [];
      this.categoriesChartData = {
        labels: data.map((d: any) => d.category),
        datasets: [
          {
            label: 'Ventas por Categoría',
            data: data.map((d: any) => d.totalSales),
            backgroundColor: '#F4E3C1',
            borderColor: '#F4E3C1',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Revenue over time
    this.dashboardService.getRevenueOverTime(start, end).subscribe((res) => {
      const raw = res.data || [];
      const labels = raw.map((x: any) => {
        const d = new Date(x.date + 'T00:00:00');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      });

      const data = raw.map((x: any) => x.totalRevenue);

      this.revenueChartData = {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data,
            borderColor: '#b38558',
            tension: 0.2,
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Top products
    this.dashboardService.getTopProducts(start, end).subscribe((res) => {
      const data: TopProduct[] = res.data || [];
      this.topProductsChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Unidades Vendidas',
            data: data.map((d) => d.totalSold),
            backgroundColor: '#F4E3C1',
            borderColor: '#F4E3C1',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Worst products
    this.dashboardService.getWorstProducts(start, end).subscribe((res) => {
      const data: any[] = res.data || [];
      this.worstProductsChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Unidades Vendidas',
            data: data.map((d) => d.totalSold),
            backgroundColor: '#c94c4c',
            borderColor: '#c94c4c',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Top customers
    this.dashboardService.getTopCustomers(start, end).subscribe((res) => {
      const data: TopCustomer[] = res.data || [];
      this.topCustomersChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Total compra cliente',
            data: data.map((d) => d.totalSpent),
            backgroundColor: '#F4E3C1',
            borderColor: '#F4E3C1',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Worst customers
    this.dashboardService.getWorstCustomers(start, end).subscribe((res) => {
      const data: any[] = res.data || [];
      this.worstCustomersChartData = {
        labels: data.map((d) => d.name ?? 'Usuario desconocido'),
        datasets: [
          {
            label: 'Total de órdenes canceladas',
            data: data.map((d) => d.totalCancelled),
            backgroundColor: '#b38558',
            borderColor: '#b38558',
            borderWidth: 1
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Orders by status (doughnut)
    this.dashboardService.getOrderStatusSummary(start, end).subscribe((res) => {
      const summary = res.data || { completed: 0, pending: 0, cancelled: 0, rescheduled: 0 };
      this.orderStatusChartData = {
        labels: ['Completadas', 'Pendientes', 'Canceladas', 'Reenviadas'],
        datasets: [
          {
            data: [
              summary.completed ?? 0,
              summary.pending ?? 0,
              summary.cancelled ?? 0,
              summary.rescheduled ?? 0,
            ],
            backgroundColor: [
              '#6b8e23',  // Completadas
              '#ffd700', // Pendientes
              '#c94c4c', // Canceladas
              'orange',  // Reenviadas
            ]
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Total revenue
    this.dashboardService.getRevenue(start, end).subscribe(res => {
      this.totalRevenue = res.data ?? 0;
      this.cdr.markForCheck();
    });

    // ORDERS PER DAY: count + breakdown (if backend provides)
    this.loadOrdersPerDay(start, end);
  }

  // --- ORDERS PER DAY + breakdown ---
  loadOrdersPerDay(startDate?: string, endDate?: string) {
    if (!this.startDate || !this.endDate) {
      this.ordersPerDayChartData = { labels: [], datasets: [] };
      this.orderStatusPerDay = [];
      this.ordersPerDayRawDates = [];
      this.cdr.markForCheck();
      return;
    }

    // Podés pasar startDate/endDate o usar this.startDate/this.endDate
    const start = startDate ?? this.startDate;
    const end = endDate ?? this.endDate;
  }
}
