import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditListSuppliersComponent } from './edit-list-suppliers.component';

describe('EditListSuppliersComponent', () => {
  let component: EditListSuppliersComponent;
  let fixture: ComponentFixture<EditListSuppliersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListSuppliersComponent]
    });
    fixture = TestBed.createComponent(EditListSuppliersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
