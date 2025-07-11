import { TestBed } from '@angular/core/testing';

import { FilterCitiesProvinceService } from './filter-cities-province.service';

describe('FilterCitiesProvinceService', () => {
  let service: FilterCitiesProvinceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterCitiesProvinceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
