import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { MatMenuModule } from '@angular/material/menu';
import { expect } from '@jest/globals';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NavBarEventService } from '../services/nav-bar-event.service';
import { AuthService } from '../services/auth.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

declare global {
  interface Window {
    bootstrap: any;
  }
}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let debugElement: DebugElement;
  let navBarEventService: jest.Mocked<NavBarEventService>;
  let authService: jest.Mocked<AuthService>;

  const mockNavBarEventService = {
    emitLoginEvent: jest.fn(),
    emitLogoutEvent: jest.fn()
  };

  const mockAuthService = {
    isLoggedIn$: jest.fn(() => of(false)),
    isAdmin$: jest.fn(() => of(false)),
    isAuthenticated: jest.fn(),
    isAdmin: jest.fn(),
    logout: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarComponent],
      imports: [
        HttpClientTestingModule,
        MatToolbarModule,
        MatButtonModule,
        MatMenuModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: NavBarEventService, useValue: mockNavBarEventService },
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    navBarEventService = TestBed.inject(NavBarEventService) as jest.Mocked<NavBarEventService>;
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the navigation bar with the brand', () => {
    const brandElement = debugElement.query(By.css('.navbar-brand'));
    expect(brandElement).toBeTruthy();
    expect(brandElement.nativeElement.textContent).toContain('Coco Purse');
  });

  it('should display the categories button', () => {
    const button = debugElement.query(By.css('button[mat-button]'));
    expect(button.nativeElement.textContent).toContain('Categorías');
  });

  it('should display the user icon if the user is authenticated', () => {
    mockAuthService.isLoggedIn$.mockReturnValue(of(true));
    mockAuthService.isAuthenticated.mockReturnValue(true);
    component.isLoggedIn = true;
    fixture.detectChanges();
    
    const userIcon = debugElement.query(By.css('mat-icon#UserInformation'));
    expect(userIcon).toBeTruthy();
  });

  it('should display the shopping cart icon', () => {
    const cartIcon = debugElement.query(By.css('button#shopping_cart')); 
    expect(cartIcon).toBeTruthy();
    expect(cartIcon.nativeElement.textContent).toContain('shopping_cart');
  });

  it('should display the Admin button if the user is an administrator', () => {
    mockAuthService.isAdmin$.mockReturnValue(of(true));
    mockAuthService.isAdmin.mockReturnValue(true);
    component.isAdmin = true;
    fixture.detectChanges();
    
    const adminButton = debugElement.query(By.css('button#admin-button'));
    expect(adminButton).toBeTruthy();
    expect(adminButton.nativeElement.textContent).toContain('Admin');
  });

  it('should not display the Admin button if the user is not an administrator', () => {
    mockAuthService.isAdmin$.mockReturnValue(of(false));
    mockAuthService.isAdmin.mockReturnValue(false);
    component.isAdmin = false;
    fixture.detectChanges();

    const adminButton = debugElement.query(By.css('#admin-button'));
    expect(adminButton).toBeFalsy();
  });

  it('should display the search form', () => {
    const searchForm = debugElement.query(By.css('#search-form'));
    expect(searchForm).toBeTruthy();
  });

  it('should display the "Logout" button when the user is authenticated', () => {
    mockAuthService.isLoggedIn$.mockReturnValue(of(true));
    mockAuthService.isAuthenticated.mockReturnValue(true);
    component.isLoggedIn = true;
    fixture.detectChanges();
    
    const logoutButton = debugElement.query(By.css('button#logout'));
    expect(logoutButton.nativeElement.textContent).toContain('Cerrar Sesion');
  });

  it('should display the "Login" button when the user is not authenticated', () => {
    mockAuthService.isLoggedIn$.mockReturnValue(of(false));
    mockAuthService.isAuthenticated.mockReturnValue(false);
    component.isLoggedIn = false;
    fixture.detectChanges();
    
    const loginButton = debugElement.query(By.css('button#login'));
    expect(loginButton.nativeElement.textContent).toContain('Iniciar Sesion');
  });
});