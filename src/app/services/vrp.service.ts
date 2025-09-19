import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Route {
  orderId: string;
  orderNumber?: string;
  firstName?: string;
  lastName?: string;
  total?: number;
  address: string;
  lat?: number;
  lon?: number;
}

export interface ProvinceRoutes {
  route: Route[];
  mapsLink: string;
}

export interface WeeklyRoutesResponse {
  totalOrders: number;
  routesByProvince: Record<string, ProvinceRoutes>;
  notGeolocated: any[];
}


@Injectable({
  providedIn: 'root'
})
export class VrpService {
  private apiUrl = `${environment.apiUrl}api`; 

  constructor(private http: HttpClient) {}
  private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('access_token');
      return new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }
  
  getWeeklyRoutes(): Observable<WeeklyRoutesResponse> {
    return this.http.get<WeeklyRoutesResponse>(`${this.apiUrl}/vrp/routes/weekly`,{ headers: this.getAuthHeaders()  });
  }
}
