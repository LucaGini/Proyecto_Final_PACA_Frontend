import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListProductsComponent } from './edit-list-products.component';

describe('EditListProductsComponent', () => {
  let component: EditListProductsComponent;
  let fixture: ComponentFixture<EditListProductsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListProductsComponent]
    });
    fixture = TestBed.createComponent(EditListProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
