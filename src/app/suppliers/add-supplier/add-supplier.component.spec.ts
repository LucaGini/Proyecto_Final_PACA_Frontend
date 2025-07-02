import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, NgForm } from '@angular/forms';
import { AddSupplierComponent } from './add-supplier.component';
import { expect } from '@jest/globals';
import { SupplierService } from '../../services/supplier.service';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';


describe('AddSupplierComponent', () => {
  let component: AddSupplierComponent;
  let fixture: ComponentFixture<AddSupplierComponent>;
  let supplierService: SupplierService;
  let router: Router;

  const mockSupplierService = {
    add: jest.fn(() => of({})),
    findSupplierByCuit: jest.fn(() => of(null))
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddSupplierComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: SupplierService, useValue: mockSupplierService },
        { provide: Router, useValue: mockRouter}
      ]
    });
    fixture = TestBed.createComponent(AddSupplierComponent);
    component = fixture.componentInstance;
    supplierService = TestBed.inject(SupplierService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should CUIT control be invalid if empty', () => {
    component.cuitControl.setValue('');
    expect(component.cuitControl.valid).toBeFalsy();
  });

  it('should CUIT control be invalid if it does not match the pattern', () => {
    component.cuitControl.setValue('1234');
    expect(component.cuitControl.valid).toBeFalsy();
  });

  it('should display an error message if the CUIT control is invalid', () => {
    const swalFireSpy = jest.spyOn(Swal, 'fire');
    component.cuitControl.setValue('1234');
    component.add({} as any);
    expect(swalFireSpy).toHaveBeenCalledWith({
      icon: 'error',
      title: 'Error en el registro',
      text: 'El CUIT debe tener exactamente 11 caracteres numéricos.',
    });
  });

  it('should add a supplier successfully', () => {
    const swalFireSpy = jest.spyOn(Swal, 'fire');
    const routerNavigateSpy = jest.spyOn(router, 'navigate');
    const mockAddForm = {
      value: {
        name: 'Test Supplier',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@example.com',
      },
      resetForm: jest.fn(),
    } as unknown as NgForm;
    const mockSupplier = {
      id: 1,
      name: 'Test Supplier',
      address: 'Test Address',
      phone: '1234567890',
      email: 'test@example.com',
      cuit: '12345678901',
    };
    (mockSupplierService.add as jest.Mock).mockReturnValue(of(mockSupplier));
    (mockSupplierService.findSupplierByCuit as jest.Mock).mockReturnValue(of(null));
    component.cuitControl.setValue('12345678901');
    component.add(mockAddForm);
    expect(mockSupplierService.add).toHaveBeenCalled();
    expect(swalFireSpy).toHaveBeenCalledWith(
      'Proveedor agregado con éxito!!',
      '',
      'success'
    );
    expect(mockAddForm.resetForm).toHaveBeenCalled();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['AdminSuppliers']);
  });
});