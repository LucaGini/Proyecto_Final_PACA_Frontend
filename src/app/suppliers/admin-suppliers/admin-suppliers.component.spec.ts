import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSuppliersComponent } from './admin-suppliers.component';

describe('AdminSuppliersComponent', () => {
  let component: AdminSuppliersComponent;
  let fixture: ComponentFixture<AdminSuppliersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminSuppliersComponent]
    });
    fixture = TestBed.createComponent(AdminSuppliersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
