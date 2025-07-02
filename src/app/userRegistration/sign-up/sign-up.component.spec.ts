import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignUpComponent } from './sign-up.component';
import { FormsModule, NgForm, FormControl, Validators } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CityService } from '../../services/city.service';
import { ProvinceService } from '../../services/province.service';
import { of, throwError} from 'rxjs';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let userService: UserService;
  let cityService: CityService;
  let provinceService: ProvinceService;
  let router: Router;

  const mockUserService = {
    createUser: jest.fn(() => of({})),
    findUserByEmail: jest.fn(() => of(null))
  };

  const mockCityService = {
    findAll: jest.fn(() => of([]))
  };

  const mockProvinceService = {
    findAll: jest.fn(() => of([])),
    findCitiesByProvince: jest.fn(() => of([]))
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [SignUpComponent],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: CityService, useValue: mockCityService },
        { provide: ProvinceService, useValue: mockProvinceService },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    cityService = TestBed.inject(CityService);
    provinceService = TestBed.inject(ProvinceService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate password format', () => {
    expect(component.validatePassword('weak')).toBeFalsy();
    expect(component.validatePassword('StrongPass1!')).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalsy();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTruthy();
  });

  it('should load provinces on init', () => {
    const spy = jest.spyOn(provinceService, 'findAll');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should load cities when a province is selected', () => {
    const spy = jest.spyOn(provinceService, 'findCitiesByProvince');
    (provinceService.findCitiesByProvince as jest.Mock).mockReturnValue(of([]));
    component.selectedProvince = 'someProvince';
    component.getCities();
    expect(spy).toHaveBeenCalled();
  });

  it('should set provinces array on successful province fetch', () => {
    const mockProvinces = [{ id: 1, name: 'Province 1' }, { id: 2, name: 'Province 2' }];
    (provinceService.findAll as jest.Mock).mockReturnValue(of(mockProvinces));
    component.getProvinces();
    expect(component.provinces).toEqual(mockProvinces);
  });

  it('should handle error when fetching provinces', () => {
    const consoleSpy = jest.spyOn(console, 'error');
    const error = new Error('Failed to fetch provinces');
    (provinceService.findAll as jest.Mock).mockReturnValue(throwError(error));
    component.getProvinces();
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching provinces', error);
  });

  it('should not call cityService.findAll when selectedProvince is empty', () => {
    component.selectedProvince = '';
    component.getCities();
    expect(cityService.findAll).not.toHaveBeenCalled();
  });
});