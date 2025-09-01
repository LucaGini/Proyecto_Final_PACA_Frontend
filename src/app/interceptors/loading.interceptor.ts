import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service'; // Ajustá el path si hace falta

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 👇 lista de endpoints que NO deben mostrar spinner
    const excludedUrls = [
      '/verify-stock',
      '/api/chatbot' 
    ];

    const shouldExclude = excludedUrls.some(url => req.url.includes(url));

    if (!shouldExclude) {
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (!shouldExclude) {
          this.loadingService.hide();
        }
      })
    );
  }
}
