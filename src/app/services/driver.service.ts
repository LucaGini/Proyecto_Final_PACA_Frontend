@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private URL = `${environment.apiUrl}api`; 
  private driversSubject = new BehaviorSubject<any[]>([]);
  drivers$ = this.driversSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadDrivers();
  }

  private loadDrivers() {
    this.findAll().subscribe({
      next: (drivers: any[]) => {
        this.driversSubject.next(drivers);
      },
      error: (error) => {
        console.error('Error loading drivers:', error);
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  add(driverData: any): Observable<any> {
    return this.http.post<any>(`${this.URL}/drivers`, driverData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.loadDrivers()) // 🔁 actualiza lista
      );
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.URL}/drivers/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.loadDrivers()) // 🔁 actualiza lista
      );
  }

  update(driver: any): Observable<any> {
    return this.http.patch<any>(`${this.URL}/drivers/${driver.id}`, driver, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => this.loadDrivers()) // 🔁 actualiza lista
      );
  }

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/drivers`).pipe(
      map(response => Array.isArray(response) ? response : response.data || [])
    );
  }
}
