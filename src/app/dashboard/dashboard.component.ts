import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService, ProvinceSales, TopProduct, TopCustomer} from '../services/dashboard.service';
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

  selectedSection: 'ventas' | 'ordenes' | 'clientes' = 'ventas';
  isLoading = signal(false);

  ngAfterViewInit(): void {
    // No-op, pero necesario para que panels esté disponible
  }
  readonly panelOpenState = signal(false);

  // Devuelve true si al menos una gráfica tiene datos
  get hasAnyChartDataFlag(): boolean {
    const hasData = (chart: any) => 
      chart && chart.datasets && chart.datasets.some( (ds: any) =>
          Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v !== null && v !== undefined)

  );

    return (
      hasData(this.topProductsChartData) ||
      hasData(this.worstProductsChartData) ||
      hasData(this.salesChartData) ||
      hasData(this.citiesChartData) ||
      hasData(this.categoriesChartData) ||
      hasData(this.productsByCategoryChartData) ||
      hasData(this.topCustomersChartData) ||
      hasData(this.worstCustomersChartData) ||
      hasData(this.orderStatusChartData)
    );
  }

  // Devuelve la fecha de hoy en formato YYYY-MM-DD para limitar las fechas
  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  get isDateRangeEmpty(): boolean {
    return !this.startDate || !this.endDate;
  }

  get noChartData(): boolean {
    return !this.hasAnyChartData && !this.isDateRangeEmpty;
  }

  get hasAnyChartData(): boolean {
    const hasData = (chart: any) =>
      chart && chart.datasets && chart.datasets.some(
        (ds: any) =>
          Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v !== null && v !== undefined)
      );

    return (
      hasData(this.topProductsChartData) ||
      hasData(this.worstProductsChartData) ||
      hasData(this.salesChartData) ||
      hasData(this.citiesChartData) ||
      hasData(this.categoriesChartData) ||
      hasData(this.productsByCategoryChartData) ||
      hasData(this.topCustomersChartData) ||
      hasData(this.worstCustomersChartData) ||
      hasData(this.orderStatusChartData)
    );
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
    return !this.hasData(this.orderStatusChartData);
  }

  get noChartDataClientes(): boolean {
    return (
      !this.hasData(this.topCustomersChartData) &&
      !this.hasData(this.worstCustomersChartData)
    );
  }

  // Reutilizable:
  private hasData(chart: ChartData<any>): boolean {
    return ( chart && chart.datasets && chart.datasets.some( (ds) =>
      Array.isArray(ds.data) &&
      ds.data.some((v: any) => v !== 0 && v != null)
      )
    );
  }

  // Descarga PDF de todas las gráficas
async downloadPDF() {
  this.isLoading.set(true);

  await Promise.resolve();

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const img = new Image();
    img.src = 'assets/img/paca-logo.png';

    const sections: ('ventas' | 'ordenes' | 'clientes')[] = [
      'ventas',
      'ordenes',
      'clientes',
    ];

    let pageNum = 1;

    for (const section of sections) {
      this.selectedSection = section;
      this.cdr.detectChanges();

      await new Promise((r) => setTimeout(r, 500));

      const chartCards = Array.from(
        document.querySelectorAll('.chart-card')
      ) as HTMLElement[];

      for (let i = 0; i < chartCards.length; i++) {
        const card = chartCards[i];
        const canvas = await html2canvas(card, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL('image/png');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgWidth = pageWidth - 80;
        let imgHeight = canvas.height * (imgWidth / canvas.width);

        if (imgHeight > pageHeight - 120) {
          imgHeight = pageHeight - 120;
          imgWidth = canvas.width * (imgHeight / canvas.height);
        }

        // --- Encabezado con logo + título ---
        pdf.addImage(img, 'PNG', 20, 15, 40, 40);
        pdf.setFontSize(18);
        pdf.text('Dashboard Completo', pageWidth / 2, 35, { align: 'center' });

        // --- Imagen de la tarjeta (gráfico) ---
        pdf.addImage(imgData, 'PNG', 40, 70, imgWidth, imgHeight);

        // --- Pie de página ---
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Generado el ${new Date().toLocaleDateString()}`,
          40,
          pageHeight - 20
        );
        pdf.text(
          `Página ${pageNum}`,
          pageWidth - 80,
          pageHeight - 20
        );

        // Añadir nueva página si no es la última
        if (
          !(section === sections[sections.length - 1] &&
          i === chartCards.length - 1)
        ) {
          pdf.addPage();
        }

        pageNum++;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    pdf.save(`Dashboard_${today}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
  } finally {
    this.isLoading.set(false);
    this.cdr.markForCheck();
  }
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

  ///VETAS///

  // Ventas por provincia
  salesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Ventas por Provincia', data: [] }],
  };
  salesChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  // Ventas por ciudad
  citiesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  citiesChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  // Categoraas
  categoriesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Ventas por Categoría', data: [] }],
  };
  categoriesChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  //Productos por categoria
  productsByCategoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  productsByCategoryChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  };

  // Ganancias a lo largo del tiempo
  revenueChartData: ChartData<'line'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'line'> = { responsive: true };

  ///PRODUCTOS///

  // Top productos
  topProductsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Top 5 Productos', data: [] }],
  };
  topProductsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { position: 'top' } },
  };

  // Peores productos
  worstProductsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Top 5 Peores Productos', data: [] }],
  };
  worstProductsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { position: 'top' } },
  };

  ///CLIENTES ///

  // Top clientes
  topCustomersChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Top 5 Clientes', data: [] }],
  };
  topCustomersChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { position: 'top' } },
  };

  // Peores clientes
  worstCustomersChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Peores 5 Clientes', data: [] }],
  };
  worstCustomersChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    indexAxis: 'y',
    plugins: { legend: { position: 'top' } },
  };

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
      const province = this.salesChartData.labels?.[
        chartElement.index
      ] as string;

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
    this.dashboardService
      .getSalesByCity(province, this.startDate, this.endDate)
      .subscribe((res) => {
        const data = res.data;
        this.citiesChartData = {
          labels: data.map((d: any) => d.city),
          datasets: [
            {
              label: `Ventas en ${province}`,
              data: data.map((d: any) => d.totalSales),
              backgroundColor: ['#b38558'],
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  onCategoryClick(event: any) {
    if (event.active && event.active.length > 0) {
      const chartElement = event.active[0];
      const category = this.categoriesChartData.labels?.[
        chartElement.index
      ] as string;

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
    this.dashboardService
      .getProductsByCategory(category, this.startDate, this.endDate)
      .subscribe((res) => {
        const data = res.data;
        this.productsByCategoryChartData = {
          labels: data.map((d: any) => d.name),
          datasets: [
            {
              label: `Productos en ${category}`,
              data: data.map((d: any) => d.totalSold),
              backgroundColor: ['#b38558'],
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  loadCharts() {
    // Convertir startDate y endDate a Date y sumar 1 día
    const starless = this.startDate ? new Date(this.startDate) : null;
    const endless = this.endDate ? new Date(this.endDate) : null;

    const startPlus1 = starless
      ? new Date(starless.getTime() + 24 * 60 * 60 * 1000)
      : null;
    const endPlus1 = endless
      ? new Date(endless.getTime() + 24 * 60 * 60 * 1000)
      : null;

    const start = startPlus1 ? startPlus1.toISOString().split('T')[0] : '';
    const end = endPlus1 ? endPlus1.toISOString().split('T')[0] : '';

    // Ventas por provincia
    this.dashboardService.getSalesByProvince(start, end).subscribe((res) => {
      const data: ProvinceSales[] = res.data;
      this.salesChartData = {
        labels: data.map((d) => d.province),
        datasets: [
          {
            label: 'Ventas por Provincia',
            data: data.map((d) => d.totalSales),
            backgroundColor: ['#6b8e23'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Ventas por categoría
    this.dashboardService.getSalesByCategory(start, end).subscribe((res) => {
      const data = res.data;
      this.categoriesChartData = {
        labels: data.map((d: any) => d.category),
        datasets: [
          {
            label: 'Ventas por Categoría',
            data: data.map((d: any) => d.totalSales),
            backgroundColor: ['#F4E3C1'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Ganancias en el tiempo
    this.dashboardService.getRevenueOverTime(start, end).subscribe((res) => {
      const labels = res.data.map((x: any) => {
        const d = new Date(x.date + 'T00:00:00');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      });

      const data = res.data.map((x: any) => x.totalRevenue);

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
      const data: TopProduct[] = res.data;
      this.topProductsChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Unidades Vendidas',
            data: data.map((d) => d.totalSold),
            backgroundColor: ['#F4E3C1'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Peores productos
    this.dashboardService.getWorstProducts(start, end).subscribe((res) => {
      const data: any[] = res.data;
      this.worstProductsChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Unidades Vendidas',
            data: data.map((d) => d.totalSold),
            backgroundColor: ['#c94c4c'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Top clientes
    this.dashboardService.getTopCustomers(start, end).subscribe((res) => {
      const data: TopCustomer[] = res.data;
      this.topCustomersChartData = {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Total compra cliente',
            data: data.map((d) => d.totalSpent),
            backgroundColor: ['#F4E3C1'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Peores clientes
    this.dashboardService.getWorstCustomers(start, end).subscribe((res) => {
      const data: any[] = res.data;
      this.worstCustomersChartData = {
        labels: data.map((d) => d.name ?? 'Usuario desconocido'),
        datasets: [
          {
            label: 'Total de órdenes canceladas',
            data: data.map((d) => d.totalCancelled),
            backgroundColor: ['#b38558'],
          },
        ],
      };
      this.cdr.markForCheck();
    });

    // Órdenes por estado
    this.dashboardService.getOrderStatusSummary(start, end).subscribe((res) => {
      const summary = { completed: 0, pending: 0, cancelled: 0 };

      res.data.forEach((item: any) => {
        if (item.status === 'completed') summary.completed = item.total;
        if (item.status === 'pending') summary.pending = item.total;
        if (item.status === 'cancelled') summary.cancelled = item.total;
      });

      this.orderStatusChartData = {
        labels: ['Completadas', 'Pendientes', 'Canceladas'],
        datasets: [
          {
            data: [summary.completed, summary.pending, summary.cancelled],
            backgroundColor: ['#6b8e23', '#ffd700', '#c94c4c'],
          },
        ],
      };

      this.cdr.markForCheck();
    });
  }
}
