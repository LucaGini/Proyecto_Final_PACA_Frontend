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
  // Capturamos las tarjetas de las gráficas para exportar el PDF de forma robusta
  @ViewChildren('chartCard', { read: ElementRef }) chartCardElements!: QueryList<ElementRef<HTMLElement>>;

  selectedSection: 'ventas' | 'ordenes' | 'clientes' = 'ventas';
  isLoading = signal(false);
  totalRevenue: number = 0;
  orderStatusPerDay: any[] = [];

  ngAfterViewInit(): void {
    // No-op; panel refs y chartCardElements quedan disponibles después de init
  }
  readonly panelOpenState = signal(false);

  // Devuelve la fecha de hoy en formato YYYY-MM-DD para limitar las fechas
  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  startDate: string = '';
  endDate: string = '';
  selectedProvince: string = '';
  selectedCategory: string = '';

  hasActiveFilters(): boolean {
    return !!(
      this.startDate ||
      this.endDate ||
      this.selectedProvince ||
      this.selectedCategory
    );
  }

  // --- Charts data & options (iniciales) ---
  // Ventas por provincia
  salesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Provincia', data: [] }] };
  salesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Ventas por ciudad
  citiesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  citiesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Categorías
  categoriesChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Ventas por Categoría', data: [] }] };
  categoriesChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Productos por categoría
  productsByCategoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  productsByCategoryChartOptions: ChartOptions<'bar'> = { responsive: true, plugins: { legend: { position: 'top' } } };

  // Ganancias a lo largo del tiempo
  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'line'> = { responsive: true };

  // Top productos
  topProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Productos', data: [] }] };
  topProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Peores productos
  worstProductsChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Peores Productos', data: [] }] };
  worstProductsChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Top clientes
  topCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Top 5 Clientes', data: [] }] };
  topCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Peores clientes
  worstCustomersChartData: ChartData<'bar'> = { labels: [], datasets: [{ label: 'Peores 5 Clientes', data: [] }] };
  worstCustomersChartOptions: ChartOptions<'bar'> = { responsive: true, indexAxis: 'y', plugins: { legend: { position: 'top' } } };

  // Órdenes por estado (torta)
  orderStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  orderStatusChartOptions: ChartOptions<'doughnut'> = { responsive: true };

  // Órdenes por día (nuevo KPI)
  ordersPerDayChartData: ChartData<'line'> = { labels: [], datasets: [] };
  ordersPerDayChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          // afterBody muestra el breakdown si está disponible en orderStatusPerDay
          afterBody: (context: any) => {
            const idx = context[0]?.dataIndex ?? 0;
            const day = this.orderStatusPerDay[idx];
            if (!day) return [];
            // Formateamos líneas separadas
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

  // Unifica si hay datos en cualquier chart (usado para habilitar descargar PDF)
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

  // Reutilizable:
  private hasData(chart: ChartData<any>): boolean {
    return (chart && chart.datasets && chart.datasets.some((ds: any) =>
      Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v != null)
    ));
  }

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCharts();
  }

  onDateChange() {
    this.loadCharts();
    if (this.selectedProvince) {
      this.loadSalesByCity(this.selectedProvince);
    }
    if (this.selectedCategory) {
      this.loadProductsByCategory(this.selectedCategory);
    }
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
      // Si no hay click activo, limpiar detalle
      this.selectedProvince = '';
      this.citiesChartData = { labels: [], datasets: [] };
    }
  }

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
              backgroundColor: '#b38558',
              borderColor: '#b38558',
              borderWidth: 1
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  // Genera el PDF usando las tarjetas capturadas por ViewChildren
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

      // Forzamos detección para que el DOM esté listo
      this.cdr.detectChanges();
      await new Promise((r) => setTimeout(r, 250));

      // Tomamos los elementos visibles (filtrados por sección)
      const cards = this.chartCardElements ? this.chartCardElements.toArray() : [];
      let pageNum = 1;

      for (let i = 0; i < cards.length; i++) {
        const elRef = cards[i];
        const el = elRef.nativeElement as HTMLElement;

        // Si el elemento no está en el DOM visible (p. ej. otra sección), saltarlo
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

        // Encabezado
        pdf.addImage(img, 'PNG', 20, 15, 40, 40);
        pdf.setFontSize(18);
        pdf.text('Dashboard Completo', pageWidth / 2, 35, { align: 'center' });

        // Imagen del gráfico
        pdf.addImage(imgData, 'PNG', 40, 70, imgWidth, imgHeight);

        // Pie de página
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Generado el ${new Date().toLocaleDateString()}`, 40, pageHeight - 20);
        pdf.text(`Página ${pageNum}`, pageWidth - 80, pageHeight - 20);

        // Nueva página si no es la última
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
    // Convertir startDate y endDate a Date y sumar 1 día (mantengo tu lógica original)
    const starless = this.startDate ? new Date(this.startDate) : null;
    const endless = this.endDate ? new Date(this.endDate) : null;

    const startPlus1 = starless ? new Date(starless.getTime() + 24 * 60 * 60 * 1000) : null;
    const endPlus1 = endless ? new Date(endless.getTime() + 24 * 60 * 60 * 1000) : null;

    const start = startPlus1 ? startPlus1.toISOString().split('T')[0] : '';
    const end = endPlus1 ? endPlus1.toISOString().split('T')[0] : '';

    // Ventas por provincia
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

    // Ventas por categoría
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

    // Ganancias en el tiempo
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

    // Top productos
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

    // Peores productos
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

    // Top clientes
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

    // Peores clientes (cancelaciones)
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

    // Órdenes por estado (torta)
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

    // ORDERS PER DAY (nuevo KPI): llamo tanto el total por día como el breakdown por estado por día
    this.loadOrdersPerDay(start, end);
  }

  // Carga órdenes por día y breakdown por estado por día (si el backend lo provee)
  loadOrdersPerDay(startDate?: string, endDate?: string) {
    // si no hay fechas, no hacemos nada
    if (!this.startDate || !this.endDate) {
      this.ordersPerDayChartData = { labels: [], datasets: [] };
      this.orderStatusPerDay = [];
      this.cdr.markForCheck();
      return;
    }

    // Pedimos el conteo por día
    this.dashboardService.getOrdersCountByDay(this.startDate, this.endDate)
      .subscribe((res: any) => {
        const data = res || [];
        // Normalizar labels en formato DD/MM/YYYY para que coincida con revenue
        const labels = data.map((d: any) => {
          // backend puede devolver '2025-11-01' o similar
          const parts = (d.date || '').split('T')[0].split('-');
          if (parts.length === 3) {
            const [y, m, day] = parts;
            return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
          }
          return d.date;
        });

        this.ordersPerDayChartData = {
          labels,
          datasets: [
            {
              label: 'Órdenes por día',
              data: data.map((d: any) => d.count ?? 0),
              tension: 0.2,
              borderWidth: 2,
              fill: false,
              borderColor: '#c94c4c'
            }
          ]
        };
        this.cdr.markForCheck();
      });

    // Pedimos detalle por estado por día (opcional)
    this.dashboardService.getOrderStatusByDay(this.startDate, this.endDate)
      .subscribe((res: any) => {
        // Esperamos: [{ date, pending, completed, cancelled, rescheduled }]
        this.orderStatusPerDay = (res || []).map((d: any) => ({
          pending: d.pending ?? 0,
          completed: d.completed ?? 0,
          cancelled: d.cancelled ?? 0,
          rescheduled: d.rescheduled ?? 0,
          date: d.date
        }));
        this.cdr.markForCheck();
      }, (err) => {
        // Si falla este endpoint no bloqueamos el KPI principal
        this.orderStatusPerDay = [];
      });
  }
}
