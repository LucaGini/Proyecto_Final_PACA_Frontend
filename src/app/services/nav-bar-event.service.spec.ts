import { TestBed } from '@angular/core/testing';

import { NavBarEventService } from './nav-bar-event.service';

describe('NavBarEventService', () => {
  let service: NavBarEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavBarEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
