import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListProvincesComponent } from './edit-list-provinces.component';

describe('EditListProvincesComponent', () => {
  let component: EditListProvincesComponent;
  let fixture: ComponentFixture<EditListProvincesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListProvincesComponent]
    });
    fixture = TestBed.createComponent(EditListProvincesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
