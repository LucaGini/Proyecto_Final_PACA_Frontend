import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurchargelistComponent } from './surchargelist.component';

describe('SurchargelistComponent', () => {
  let component: SurchargelistComponent;
  let fixture: ComponentFixture<SurchargelistComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SurchargelistComponent]
    });
    fixture = TestBed.createComponent(SurchargelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
