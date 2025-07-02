import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCitiesComponent } from './admin-cities.component';

describe('AdminCitiesComponent', () => {
  let component: AdminCitiesComponent;
  let fixture: ComponentFixture<AdminCitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminCitiesComponent]
    });
    fixture = TestBed.createComponent(AdminCitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
