import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { VrpService, WeeklyRoutesResponse, ProvinceRoutes, Route } from 'src/app/services/vrp.service';
import { CronService, CronConfig } from '../services/cron.service';

@Component({
  selector: 'app-vrp',
  templateUrl: './vrp.component.html',
  styleUrls: ['./vrp.component.scss']
})
export class VrpComponent implements OnInit, AfterViewInit {

  weeklyRoutes: WeeklyRoutesResponse | null = null;
  private map!: L.Map;

  // 🔹 Cron
  cronExpression: string = '';
  latestCron: CronConfig | null = null;
  showCronModal = false;

  // 🔹 Estado general
  isLoading = false;

  constructor(
    private vrpService: VrpService,
    private cronService: CronService
  ) {}

  ngOnInit() {
    // Cargar datos guardados
    const stored = localStorage.getItem('weeklyRoutes');
    if (stored) {
      this.weeklyRoutes = JSON.parse(stored);
    }

    // Obtener rutas desde backend
    this.vrpService.getWeeklyRoutes().subscribe({
      next: (res: WeeklyRoutesResponse) => {
        this.weeklyRoutes = res;
        localStorage.setItem('weeklyRoutes', JSON.stringify(res));
        if (this.map) {
          this.map.remove();
        }
        this.initMap();
        this.plotRoutes();
      },
      error: (err) => {
        console.error('Error cargando rutas semanales', err);
      }
    });

    this.loadLatestCron();
  }

  ngAfterViewInit() {
    if (this.weeklyRoutes) {
      this.initMap();
      this.plotRoutes();
    }
  }

  // ==============================
  // 🔹 MAPA Y RUTAS
  // ==============================

  getProvinces(): string[] {
    return this.weeklyRoutes ? Object.keys(this.weeklyRoutes.routesByProvince) : [];
  }

  openGoogleMaps(province: string) {
    const provinceData: ProvinceRoutes | undefined = this.weeklyRoutes?.routesByProvince[province];
    if (!provinceData) return;
    window.open(provinceData.mapsLink, "_blank");
  }

  private initMap() {
    this.map = L.map('map').setView([-34.6037, -58.3816], 6); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(this.map);
  }

  private plotRoutes() {
    if (!this.weeklyRoutes) return;

    const customIcon = L.icon({
      iconUrl: 'assets/img/marcador-de-mapa.png',
      iconSize: [20, 20],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    const colors = ['blue', 'green', 'purple', 'orange', 'red'];
    let colorIndex = 0;

    for (const province of this.getProvinces()) {
      const provinceData: ProvinceRoutes = this.weeklyRoutes.routesByProvince[province];
      const { route, mapsLink } = provinceData;
      if (!route || route.length === 0) continue;

      const latlngs: L.LatLngExpression[] = route.map((r: Route) => [r.lat!, r.lon!]);

      const polyline = L.polyline(latlngs, {
        color: colors[colorIndex % colors.length],
        weight: 4,
        opacity: 0.8
      }).addTo(this.map);

      route.forEach((r: Route) => {
        L.marker([r.lat!, r.lon!], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(
            `<b>Orden: ${r.orderNumber ?? 'Depósito'}</b><br>
             Cliente: ${r.firstName ?? ''} ${r.lastName ?? ''}<br>
             Total: $${r.total?.toLocaleString() ?? '0'}<br>
             Dirección: ${r.address}<br>
             <a href="${mapsLink}" target="_blank">Abrir en Google Maps</a>`
          );
      });

      this.map.fitBounds(polyline.getBounds());
      colorIndex++;
    }
  }

  // ==============================
  // 🔹 CRON CONFIG
  // ==============================

  loadLatestCron() {
    this.cronService.getLatestCron().subscribe({
      next: (data) => {
        this.latestCron = data;
        this.cronExpression = data.expression;
      },
      error: () => console.warn('No hay configuración previa de cron')
    });
  }

  openCronModal() {
    this.showCronModal = true;
  }

  closeCronModal() {
    this.showCronModal = false;
  }

  updateCron() {
    if (!this.cronExpression.trim()) {
      Swal.fire('Error', 'Debe ingresar una expresión válida', 'error');
      return;
    }
    console.log('Actualizando cron a:', this.cronExpression);

    this.cronService.updateCron(this.cronExpression).subscribe({
      next: (data) => {
        this.latestCron = data;
        console.log('Cron actualizado:', data);
        Swal.fire('¡Actualizado!', 'El cron se actualizó correctamente', 'success');
        this.showCronModal = false;
      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'No se pudo actualizar el cron', 'error');
      }
    });
  }

  // ==============================
  // 🔹 EXPORTAR PDF
  // ==============================

  downloadPDF() {
    if (!this.weeklyRoutes) return;
    this.isLoading = true;

    try {
      const doc = new jsPDF();

      // Logo
      const logo = new Image();
      logo.src = 'assets/img/paca-logo.png';
      doc.addImage(logo, 'PNG', 10, 10, 30, 30);

      doc.setFontSize(16);
      doc.text('Rutas semanales', 50, 20);
      doc.setFontSize(12);
      doc.text(`Total de órdenes: ${this.weeklyRoutes.totalOrders}`, 50, 35);

      let y = 50;

      // Tablas por provincia
      for (const province of this.getProvinces()) {
        const { route } = this.weeklyRoutes.routesByProvince[province];
        if (!route || route.length === 0) continue;

        doc.setFontSize(14);
        doc.text(`Provincia: ${province}`, 14, y);
        y += 5;

        const data = route.map((r: Route) => [
          r.orderNumber ?? 'DEPÓSITO',
          `${r.firstName ?? ''} ${r.lastName ?? ''}`,
          `$${r.total?.toLocaleString() ?? '0'}`,
          r.address,
          `${r.lat}, ${r.lon}`
        ]);

        autoTable(doc, {
          startY: y,
          head: [['N° Orden', 'Cliente', 'Total', 'Dirección', 'Coordenadas']],
          body: data,
          theme: 'striped',
          headStyles: { fillColor: '#F4E3C1', textColor: '#000000' },
          styles: { fontSize: 10 }
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // Órdenes no geolocalizadas
      if (this.weeklyRoutes.notGeolocated.length > 0) {
        doc.setFontSize(14);
        doc.text('Órdenes no geolocalizadas', 14, y);

        const data = this.weeklyRoutes.notGeolocated.map((order: any) => [
          order.orderNumber,
          `${order.firstName ?? ''} ${order.lastName ?? ''}`,
          `$${order.total?.toLocaleString() ?? '0'}`,
          order.address,
          order.reason
        ]);

        autoTable(doc, {
          startY: y + 5,
          head: [['N° Orden', 'Cliente', 'Total', 'Dirección', 'Motivo']],
          body: data,
          theme: 'striped',
          headStyles: { fillColor: '#c94c4c', textColor: '#ffffff' },
          styles: { fontSize: 10 }
        });
      }

      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          `Generado el ${new Date().toLocaleDateString()}`,
          14,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.getWidth() - 50,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      const today = new Date().toISOString().split('T')[0];
      doc.save(`rutas_semanales_${today}.pdf`);

    } catch (error) {
      console.error('Error exportando PDF:', error);
    } finally {
      this.isLoading = false;
    }
  }

}
