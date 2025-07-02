import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';
import { LoginService } from '../../services/login.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;
  let loginService: LoginService;

  const mockAuthService = {
    sendRequestToLogin: jest.fn(), 
    saveToken: jest.fn()
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  const mockLoginService = {
    login: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: LoginService, useValue: mockLoginService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    loginService = TestBed.inject(LoginService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.controls['email'];
    emailControl.setValue('invalid-email');
    expect(emailControl.valid).toBe(false);

    emailControl.setValue('valid@email.com');
    expect(emailControl.valid).toBe(true);
  });

  it('should validate form state', () => {
    component.loginForm.controls['email'].setValue('');
    component.loginForm.controls['password'].setValue('');
    expect(component.loginForm.valid).toBe(false);

    component.loginForm.controls['email'].setValue('test@email.com');
    component.loginForm.controls['password'].setValue('password123');
    expect(component.loginForm.valid).toBe(true);
  });

  it('should handle successful form submission', () => {
    const email = 'test@email.com';
    const password = 'password123';
    (mockAuthService.sendRequestToLogin as jest.Mock).mockReturnValue(of({ accessToken: 'fakeToken' }));

    component.loginForm.controls['email'].setValue(email);
    component.loginForm.controls['password'].setValue(password);
    component.login();

    expect(mockAuthService.sendRequestToLogin).toHaveBeenCalledWith(email, password);
    expect(mockAuthService.saveToken).toHaveBeenCalledWith('fakeToken');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should handle failed form submission', () => {
    const email = 'test@email.com';
    const password = 'password123';
    const errorMessage = 'Invalid credentials';
    (mockAuthService.sendRequestToLogin as jest.Mock).mockReturnValue(throwError({ message: errorMessage }));
  
    component.loginForm.controls['email'].setValue(email);
    component.loginForm.controls['password'].setValue(password);
    component.login();
  
    expect(mockAuthService.sendRequestToLogin).toHaveBeenCalledWith(email, password);
    expect(component.loginError).toBe(errorMessage);
  });
  
  it('should set loginError on failed login', () => {
    const email = 'test@example.com';
    const password = 'password';
    const errorMessage = 'Invalid credentials';
    (mockAuthService.sendRequestToLogin as jest.Mock).mockReturnValue(throwError({ message: errorMessage }));

    component.loginForm.setValue({ email: email, password: password });
    component.login();

    expect(component.loginError).toBe(errorMessage);
  });
});