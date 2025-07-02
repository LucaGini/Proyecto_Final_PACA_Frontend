import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListCategoriesComponent } from './edit-list-categories.component';

describe('EditListCategoriesComponent', () => {
  let component: EditListCategoriesComponent;
  let fixture: ComponentFixture<EditListCategoriesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListCategoriesComponent]
    });
    fixture = TestBed.createComponent(EditListCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
