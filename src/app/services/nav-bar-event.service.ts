import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavBarEventService {

  private categoryButtonClickSource = new Subject<string>();  
  categoryButtonClick$ = this.categoryButtonClickSource.asObservable(); 

  private searchResultsSource = new Subject<any[]>();  
  searchResults$ = this.searchResultsSource.asObservable(); 

  emitCategoryButtonClick(name: string){
    this.categoryButtonClickSource.next(name);
  }

  emitSearchResults(results: any[]) {
    this.searchResultsSource.next(results);
  }
}
