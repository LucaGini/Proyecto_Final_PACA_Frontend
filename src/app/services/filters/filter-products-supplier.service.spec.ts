import { TestBed } from '@angular/core/testing';

import { FilterProductsSupplierService } from './filter-products-supplier.service';

describe('FilterProductsSupplierService', () => {
  let service: FilterProductsSupplierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterProductsSupplierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
