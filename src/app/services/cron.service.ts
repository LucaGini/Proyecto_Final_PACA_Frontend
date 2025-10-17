import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CronConfig {
  expression: string;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CronService {
  private apiUrl = `${environment.apiUrl}api`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /** Obtener la última configuración de cron */
  getLatestCron(): Observable<CronConfig> {
    return this.http.get<CronConfig>(`${this.apiUrl}/cron`);
  }

  /** Crear una nueva configuración de cron */
  updateCron(expression: string): Observable<CronConfig> {
    return this.http.post<CronConfig>(`${this.apiUrl}/cron/add`, { expression });
  }
}
