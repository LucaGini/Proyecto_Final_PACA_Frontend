import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProvincesComponent } from './admin-provinces.component';

describe('AdminProvincesComponent', () => {
  let component: AdminProvincesComponent;
  let fixture: ComponentFixture<AdminProvincesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminProvincesComponent]
    });
    fixture = TestBed.createComponent(AdminProvincesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
