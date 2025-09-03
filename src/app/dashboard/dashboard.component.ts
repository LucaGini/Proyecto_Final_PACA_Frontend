


import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
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

  ngAfterViewInit(): void {
    // No-op, pero necesario para que panels esté disponible
  }
  readonly panelOpenState = signal(false);

  // Devuelve true si al menos una gráfica tiene datos
  hasAnyChartData(): boolean {
    const hasData = (chart: any) => chart && chart.datasets && chart.datasets.some((ds: any) => Array.isArray(ds.data) && ds.data.some((v: any) => v !== 0 && v !== null && v !== undefined));
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

  // Descarga PDF de todas las gráficas
  async downloadPDF() {
    // Expandir todos los panels y guardar su estado original
    const originalStates = this.panels ? this.panels.map(panel => panel.expanded) : [];
    if (this.panels) this.panels.forEach(panel => panel.open());

    setTimeout(async () => {
      const chartCards = Array.from(document.querySelectorAll('.chart-card')) as HTMLElement[];
      if (!chartCards.length) {
        alert('No se encontraron gráficas para exportar.');
        return;
      }
      // Validar que al menos una gráfica tenga datos (canvas no vacío)
      let hasData = false;
      for (const card of chartCards) {
        const canvasEl = card.querySelector('canvas');
        if (canvasEl) {
          // Verifica si el canvas tiene algún pixel distinto de blanco (muy simple, pero efectivo para la mayoría de los casos)
          const ctx = (canvasEl as HTMLCanvasElement).getContext('2d');
          if (ctx) {
            const pixels = ctx.getImageData(0, 0, (canvasEl as HTMLCanvasElement).width, (canvasEl as HTMLCanvasElement).height).data;
            // Si hay algún pixel no blanco, consideramos que hay datos
            for (let i = 0; i < pixels.length; i += 4) {
              if (!(pixels[i] === 255 && pixels[i+1] === 255 && pixels[i+2] === 255 && pixels[i+3] === 255)) {
                hasData = true;
                break;
              }
            }
          }
        }
        if (hasData) break;
      }
      if (!hasData) {
        alert('No hay datos para exportar. Por favor, ajusta los filtros para mostrar al menos una gráfica con información.');
        // Restaurar el estado original de los panels
        if (this.panels) this.panels.forEach((panel, idx) => {
          if (!originalStates[idx]) panel.close();
        });
        return;
      }
      // ...proceso normal de exportación...
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 40;
      let pageNum = 1;
      for (let i = 0; i < chartCards.length; i++) {
        const card = chartCards[i];
        // Capturar la gráfica (sin el título duplicado)
        const h3 = card.querySelector('h3');
        let originalDisplay = '';
        if (h3) {
          originalDisplay = h3.style.display;
          h3.style.display = 'none';
        }
        // Aumentar la escala para mayor nitidez
        const scale = 3;
        const canvas = await html2canvas(card, { scale, useCORS: true });
        if (h3) h3.style.display = originalDisplay;
        const imgData = canvas.toDataURL('image/png');
        // Calcular tamaño óptimo para máxima nitidez y mantener proporción
        let imgWidth = pageWidth - 80;
        let imgHeight = canvas.height * (imgWidth / canvas.width);
        // Si la imagen es más ancha que la página, ajusta
        if (imgHeight > pageHeight - 80) {
          imgHeight = pageHeight - 80;
          imgWidth = canvas.width * (imgHeight / canvas.height);
        }
        if (y + imgHeight > pageHeight - 40) {
          // Pie de página con número
          pdf.setFontSize(10);
          pdf.text(`Página ${pageNum}`, pageWidth - 80, pageHeight - 20);
          pdf.addPage();
          pageNum++;
          y = 40;
        }
        pdf.addImage(imgData, 'PNG', 40, y, imgWidth, imgHeight);
        y += imgHeight + 30;
      }
      // Pie de página en la última página
      pdf.setFontSize(10);
      pdf.text(`Página ${pageNum}`, pageWidth - 80, pageHeight - 20);

      // Nombre de archivo inteligente
      let fileName = 'Dashboard_BI_PACA_';
      const today = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (this.startDate && this.endDate) {
        fileName += `${this.startDate}_${this.endDate}`;
      } else {
        fileName += formatDate(today);
      }
      fileName += '.pdf';
      pdf.save(fileName);
      // Restaurar el estado original de los panels
      if (this.panels) this.panels.forEach((panel, idx) => {
        if (!originalStates[idx]) panel.close();
      });
    }, 400); // Espera a que los panels se expandan visualmente
  }

  startDate: string = '';
  endDate: string = '';
  selectedProvince: string = '';
  selectedCategory: string = '';
  hasActiveFilters(): boolean {
    return !!(this.startDate || this.endDate || this.selectedProvince || this.selectedCategory);
  }

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
  // Convertir startDate y endDate a Date y sumar 1 día
    const starless = this.startDate ? new Date(this.startDate) : null;
    const endless = this.endDate ? new Date(this.endDate) : null;

    const startPlus1 = starless ? new Date(starless.getTime() + 24*60*60*1000) : null;
    const endPlus1 = endless ? new Date(endless.getTime() + 24*60*60*1000) : null;

    const start = startPlus1 ? startPlus1.toISOString().split('T')[0] : '';
    const end = endPlus1 ? endPlus1.toISOString().split('T')[0] : '';

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
        datasets: [{
          label: 'Ingresos',
          data,
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
      const summary = { completed: 0, pending: 0, cancelled: 0 };

      res.data.forEach((item: any) => {
        if (item.status === 'completed') summary.completed = item.total;
        if (item.status === 'pending') summary.pending = item.total;
        if (item.status === 'cancelled') summary.cancelled = item.total;
      });

      this.orderStatusChartData = {
        labels: ['Completadas', 'Pendientes', 'Canceladas'],
        datasets: [{
          data: [summary.completed, summary.pending, summary.cancelled],
          backgroundColor: ['#6b8e23','#ffd700', '#c94c4c']
        }]
      };

      this.cdr.markForCheck();
    });





  }
}
