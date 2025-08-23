import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  private requests = 0;

  show() {
    this.requests++;
    this.loadingSubject.next(true);
  }

  hide() {
    this.requests--;
    if (this.requests === 0) {
      this.loadingSubject.next(false);
    }
  }
}
