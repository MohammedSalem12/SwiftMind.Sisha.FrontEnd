import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BiometricLockComponent } from './biometric-lock.component';
import { BiometricService } from '../services/biometric.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

describe('BiometricLockComponent', () => {
  let component: BiometricLockComponent;
  let fixture: ComponentFixture<BiometricLockComponent>;
  let biometricSpy: jasmine.SpyObj<BiometricService>;
  let oauthSpy: jasmine.SpyObj<OAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    biometricSpy = jasmine.createSpyObj('BiometricService', ['authenticate', 'unlock', 'lock'], {
      isLocked: jasmine.createSpy().and.returnValue(true),
    });
    oauthSpy = jasmine.createSpyObj('OAuthService', ['logOut']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BiometricLockComponent],
      providers: [
        { provide: BiometricService, useValue: biometricSpy },
        { provide: OAuthService, useValue: oauthSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BiometricLockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authenticate on verify', async () => {
    biometricSpy.authenticate.and.resolveTo(true);
    await component.verify();
    expect(biometricSpy.authenticate).toHaveBeenCalled();
    expect(biometricSpy.unlock).toHaveBeenCalled();
  });

  it('should show error on failed authentication', async () => {
    biometricSpy.authenticate.and.resolveTo(false);
    await component.verify();
    expect(component.error()).toBeTrue();
    expect(biometricSpy.unlock).not.toHaveBeenCalled();
  });

  it('should logout and navigate to login', () => {
    component.logout();
    expect(biometricSpy.unlock).toHaveBeenCalled();
    expect(oauthSpy.logOut).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
