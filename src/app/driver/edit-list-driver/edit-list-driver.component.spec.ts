import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditListDriverComponent } from './edit-list-driver.component';

describe('EditListDriverComponent', () => {
  let component: EditListDriverComponent;
  let fixture: ComponentFixture<EditListDriverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditListDriverComponent]
    });
    fixture = TestBed.createComponent(EditListDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
