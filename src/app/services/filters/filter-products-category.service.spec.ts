import { TestBed } from '@angular/core/testing';

import { FilterProductsCategoryService } from './filter-products-category.service';

describe('FilterProductsCategoryService', () => {
  let service: FilterProductsCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterProductsCategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
