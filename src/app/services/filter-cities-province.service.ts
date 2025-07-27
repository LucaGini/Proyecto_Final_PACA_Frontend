import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterCitiesProvinceService {

  private provinceSelectedSource = new Subject<string>();
  provinceSelected$ = this.provinceSelectedSource.asObservable();

  emitProvinceSelected(provinceId: string){
    this.provinceSelectedSource.next(provinceId);
  }
}
