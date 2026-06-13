import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { LoginService } from './login.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { BiometricService } from '../shared/services/biometric.service';
import { AuthRedirectService } from '../shared/services/auth-redirect.service';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let loginSvcSpy: jasmine.SpyObj<LoginService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    loginSvcSpy = jasmine.createSpyObj('LoginService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const authSpy = jasmine.createSpyObj('AuthService', ['loginUsingGrant'], {
      isAuthenticated: false,
    });
    authSpy.loginUsingGrant.and.rejectWith({ error: { error: 'invalid_grant' }, status: 400 });
    const configSpy = jasmine.createSpyObj('ConfigStateService', ['getOne', 'refreshAppState']);
    configSpy.refreshAppState.and.returnValue(of(null));
    const bioSpy = jasmine.createSpyObj('BiometricService', ['isAvailable', 'authenticate', 'getCredentials', 'isEnabled'], {
      isLocked: jasmine.createSpy().and.returnValue(false),
    });
    bioSpy.isAvailable.and.resolveTo(false);
    const redirectSpy = jasmine.createSpyObj('AuthRedirectService', ['consumeRedirectUrl']);
    redirectSpy.consumeRedirectUrl.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: LoginService, useValue: loginSvcSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ConfigStateService, useValue: configSpy },
        { provide: BiometricService, useValue: bioSpy },
        { provide: AuthRedirectService, useValue: redirectSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} }, queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty model', () => {
    const model = component.model();
    expect(model.userNameOrEmailAddress).toBe('');
    expect(model.password).toBe('');
    expect(model.rememberMe).toBeFalse();
  });

  it('should have loading as false initially', () => {
    expect(component.loading()).toBeFalse();
  });

  it('should have error as null initially', () => {
    expect(component.error()).toBeNull();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });

  it('should update username', () => {
    component.updateUsername('testuser');
    expect(component.model().userNameOrEmailAddress).toBe('testuser');
  });

  it('should update password', () => {
    component.updatePassword('pass123');
    expect(component.model().password).toBe('pass123');
  });

  it('should update rememberMe', () => {
    component.updateRememberMe(true);
    expect(component.model().rememberMe).toBeTrue();
  });

  it('should show error for empty credentials on submit', async () => {
    component.updateUsername('');
    component.updatePassword('');
    await component.submit();
    expect(component.error()).toBeTruthy();
  });
});
