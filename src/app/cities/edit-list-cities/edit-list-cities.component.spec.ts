import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListCitiesComponent } from './edit-list-cities.component';

describe('EditListCitiesComponent', () => {
  let component: EditListCitiesComponent;
  let fixture: ComponentFixture<EditListCitiesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListCitiesComponent]
    });
    fixture = TestBed.createComponent(EditListCitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
