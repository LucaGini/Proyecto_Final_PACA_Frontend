import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VrpService, WeeklyRoutesResponse } from 'src/app/services/vrp.service';

@Component({
  selector: 'app-vrp',
  templateUrl: './vrp.component.html',
  styleUrls: ['./vrp.component.scss']
})
export class VrpComponent implements OnInit, AfterViewInit {

  weeklyRoutes: WeeklyRoutesResponse | null = null;
  private map!: L.Map;

  constructor(private vrpService: VrpService) {}

  ngOnInit() {
    // si hay datos guardados en localStorage, los carga
    const stored = localStorage.getItem('weeklyRoutes');
    if (stored) {
      this.weeklyRoutes = JSON.parse(stored);
    }

    //siempre intenta traer las rutas desde el backend CON ESTA NO FUNCIONA EL MAPA
    this.vrpService.getWeeklyRoutes().subscribe({
      next: (res) => {
        this.weeklyRoutes = res;
        localStorage.setItem('weeklyRoutes', JSON.stringify(res));
        if (this.map) {
          this.map.remove(); // resetear mapa si ya existía
        }
        this.initMap();
        this.plotRoutes();
      },
      error: (err) => {
        console.error('Error cargando rutas semanales', err);
      }
    });
  }

  ngAfterViewInit() {
    if (this.weeklyRoutes) {
      this.initMap();
      this.plotRoutes();
    }
  }

  getProvinces(): string[] {
    return this.weeklyRoutes ? Object.keys(this.weeklyRoutes.routesByProvince) : [];
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
      const routes = this.weeklyRoutes.routesByProvince[province];
      const latlngs: L.LatLngExpression[] = routes.map(r => [r.lat!, r.lon!]);

      const polyline = L.polyline(latlngs, {
        color: colors[colorIndex % colors.length],
        weight: 4,
        opacity: 0.8
      }).addTo(this.map);

      routes.forEach((r) => {
        L.marker([r.lat!, r.lon!], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(
            `<b>Orden: ${r.orderNumber ?? 'Depósito'}</b><br>
             Cliente: ${r.firstName ?? ''} ${r.lastName ?? ''}<br>
             Total: $${r.total?.toLocaleString() ?? '0'}<br>
             Dirección: ${r.address}`
          );
      });

      this.map.fitBounds(polyline.getBounds());
      colorIndex++;
    }
  }

  exportPDF() {
    if (!this.weeklyRoutes) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rutas semanales', 14, 15);
    doc.setFontSize(12);
    doc.text(`Total de órdenes: ${this.weeklyRoutes.totalOrders}`, 14, 25);

    let y = 35;
    for (const province of this.getProvinces()) {
      doc.setFontSize(14);
      doc.text(`Provincia: ${province}`, 14, y);
      y += 5;

      const data = this.weeklyRoutes.routesByProvince[province].map(route => [
        route.orderNumber ?? 'DEPÓSITO',
        `${route.firstName ?? ''} ${route.lastName ?? ''}`,
        `$${route.total?.toLocaleString() ?? '0'}`,
        route.address,
        `${route.lat}, ${route.lon}`
      ]);

      autoTable(doc, {
        startY: y,
        head: [['N° Orden', 'Cliente', 'Total', 'Dirección', 'Coordenadas']],
        body: data,
        theme: 'striped',
        headStyles: { fillColor: '#F4E3C1' }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (this.weeklyRoutes.notGeolocated.length > 0) {
      doc.setFontSize(14);
      doc.text('Órdenes no geolocalizadas', 14, y);

      const data = this.weeklyRoutes.notGeolocated.map(order => [
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
        headStyles: { fillColor: '#C94C4C' }
      });
    }

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    doc.save(`rutas_semanales_${formattedDate}.pdf`);
  }
}
