import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterProductsCategoryService {

  private categorySelectedSource = new Subject<string>();
  categorySelected$ = this.categorySelectedSource.asObservable();

  emitCategorySelected(categoryName: string){
    this.categorySelectedSource.next(categoryName);
  }
}
