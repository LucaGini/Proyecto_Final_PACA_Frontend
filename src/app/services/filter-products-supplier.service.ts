import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterProductsSupplierService {

  private supplierSelectedSource = new Subject<number>();
  supplierSelected$ = this.supplierSelectedSource.asObservable();

  emitSupplierSelected(cuit: number){
    this.supplierSelectedSource.next(cuit);
  }
}
