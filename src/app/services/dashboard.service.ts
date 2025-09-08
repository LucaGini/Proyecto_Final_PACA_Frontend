import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
export interface ProvinceSales {
  provinceId: string;
  province: string;
  totalSales: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
}

export interface TopCustomer {
  userId: string;
  name: string;
  email: string | null;
  totalSpent: number;
}

export interface WorstCustomer {
  userId: string;
  name: string;
  email: string | null;
  totalCancelled: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) {}

  // 🔧 Helpers
  private buildParams(startDate?: string, endDate?: string): HttpParams {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return params;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // VTAS
  getSalesByProvince(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales-by-province`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  getSalesByCity(province: string, startDate?: string, endDate?: string): Observable<any> {
    let params = this.buildParams(startDate, endDate).set('province', province);
    return this.http.get(`${this.apiUrl}/sales-by-city`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getSalesByCategory(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sales-by-category`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  getProductsByCategory(category: string, startDate?: string, endDate?: string): Observable<any> {
    let params = this.buildParams(startDate, endDate).set('category', category);
    return this.http.get(`${this.apiUrl}/products-by-category`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getRevenueOverTime(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/earnings-over-time`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  // PRODUCTS
  getTopProducts(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-products`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  getWorstProducts(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/worst-products`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  // CLIENTES
  getTopCustomers(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-customers`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  getWorstCustomers(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/worst-customers`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }

  /// ORDENES 
  getOrderStatusSummary(startDate?: string, endDate?: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders-by-status`, {
      headers: this.getAuthHeaders(),
      params: this.buildParams(startDate, endDate)
    });
  }
}
