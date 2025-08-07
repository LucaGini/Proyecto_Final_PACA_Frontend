import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterUsersService {

  private isActiveFilterSource = new BehaviorSubject<boolean | null>(null); // null = todos
  isActiveFilter$ = this.isActiveFilterSource.asObservable();

  emitIsActiveFilter(value: boolean | null): void {
    this.isActiveFilterSource.next(value);
  }
}


