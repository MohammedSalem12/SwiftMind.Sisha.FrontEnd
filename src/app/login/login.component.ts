import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from './login.service';
import { lastValueFrom } from 'rxjs';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { environment } from '../../environments/environment';
import { BiometricService } from '../shared/services/biometric.service';

declare const google: any;
declare const FB: any;

interface LoginModel {
  userNameOrEmailAddress?: string;
  password?: string;
  rememberMe?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private readonly loginSvc = inject(LoginService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly configService = inject(ConfigStateService);
  private readonly biometricSvc = inject(BiometricService);

  model = signal<LoginModel>({ userNameOrEmailAddress: '', password: '', rememberMe: false });
  loading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);
  biometricAvailable = signal(false);
  biometricLoading = signal(false);
  googleLoading = signal(false);
  facebookLoading = signal(false);

  async ngOnInit(): Promise<void> {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
      return;
    }
    const [available, hasStored] = await Promise.all([
      this.biometricSvc.isAvailable(),
      this.biometricSvc.hasStoredCredentials(),
    ]);
    this.biometricAvailable.set(available && hasStored);
    this.initGoogleSignIn();
    this.initFacebook();
  }

  private initGoogleSignIn(): void {
    // Google Identity Services (GSI)
    const scriptId = 'google-gsi-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  private initFacebook(): void {
    const scriptId = 'facebook-sdk-script';
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      FB.init({
        appId: '811779008607282',
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
    };
    document.head.appendChild(script);
  }

  loginWithGoogle(): void {
    if (typeof google === 'undefined') {
      this.error.set('Google Sign-In is not available. Please try again.');
      return;
    }
    this.error.set(null);
    this.googleLoading.set(true);

    const client = google.accounts.oauth2.initCodeClient({
      client_id: environment.oAuthConfig?.clientId ? undefined : undefined,
      // Use implicit token flow for ID token
    });

    // Use the newer credential-based flow
    google.accounts.id.initialize({
      client_id: (environment as any).googleClientId ?? 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      callback: async (response: any) => {
        if (response?.credential) {
          try {
            await this.loginWithSocialToken('google', response.credential);
          } finally {
            this.googleLoading.set(false);
          }
        } else {
          this.googleLoading.set(false);
          this.error.set('Google sign-in was cancelled.');
        }
      },
      auto_select: false,
    });
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.googleLoading.set(false);
        this.error.set('Google sign-in popup was blocked or cancelled. Please allow popups.');
      }
    });
  }

  loginWithFacebook(): void {
    if (typeof FB === 'undefined') {
      this.error.set('Facebook Login is not available. Please try again.');
      return;
    }
    this.error.set(null);
    this.facebookLoading.set(true);

    FB.login((response: any) => {
      if (response?.authResponse?.accessToken) {
        this.loginWithSocialToken('facebook', response.authResponse.accessToken)
          .finally(() => this.facebookLoading.set(false));
      } else {
        this.facebookLoading.set(false);
        this.error.set('Facebook sign-in was cancelled.');
      }
    }, { scope: 'email,public_profile' });
  }

  private async loginWithSocialToken(provider: string, token: string): Promise<void> {
    try {
      await this.authService.loginUsingGrant('social_login', {
        provider,
        token,
        client_id: environment.oAuthConfig?.clientId ?? 'Sesha_App',
        scope: environment.oAuthConfig?.scope ?? 'offline_access Sesha',
      });
      try { await lastValueFrom(this.configService.refreshAppState()); } catch { /* ignore */ }
      await this.router.navigateByUrl('/');
      try { window.location.reload(); } catch { /* ignore */ }
    } catch (err: any) {
      const msg = err?.error?.error_description
        || err?.error?.error?.message
        || `${provider} login failed. Please try again.`;
      this.error.set(msg);
    }
  }

  async submit(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      const payload = { ...this.model() } as any;
      await this.performLogin(payload.userNameOrEmailAddress, payload.password);
      if (payload.rememberMe && payload.userNameOrEmailAddress && payload.password) {
        const isAvailable = await this.biometricSvc.isAvailable();
        if (isAvailable) {
          await this.biometricSvc.saveCredentials(payload.userNameOrEmailAddress, payload.password);
        }
      }
    } catch (err: any) {
      this.loading.set(false);
      const msg = err?.message || err?.error?.error?.message || err?.error?.error_description || 'خطأ في تسجيل الدخول / Login error';
      this.error.set(msg);
      console.error(err);
    }
  }

  async loginWithBiometric(): Promise<void> {
    this.error.set(null);
    this.biometricLoading.set(true);
    try {
      const success = await this.biometricSvc.authenticate();
      if (!success) {
        this.biometricLoading.set(false);
        return;
      }
      const creds = await this.biometricSvc.getCredentials();
      if (!creds) {
        this.biometricLoading.set(false);
        this.error.set('لا توجد بيانات محفوظة. سجّل الدخول بكلمة المرور أولاً.');
        return;
      }
      await this.performLogin(creds.username, creds.password);
    } catch (err: any) {
      this.biometricLoading.set(false);
      this.error.set('فشل التحقق البيومتري. حاول مجدداً.');
      console.error(err);
    }
  }

  private async performLogin(username: string, password: string): Promise<void> {
    const grantParams = {
      username,
      password,
      scope: environment.oAuthConfig?.scope ?? undefined,
      client_id: environment.oAuthConfig?.clientId ?? undefined,
    } as any;

    let grantFailed = false;
    let grantErr: any = null;

    try {
      await this.authService.loginUsingGrant('password', grantParams);
    } catch (err: any) {
      grantFailed = true;
      grantErr = err;
      // Wrong credentials: OAuth returns 400 invalid_grant — don't fall back, just fail fast
      const errorCode = err?.error?.error || err?.error || '';
      if (errorCode === 'invalid_grant' || err?.status === 400 || err?.status === 401) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة / Invalid username or password');
      }
    }

    if (!grantFailed) {
      // OAuth succeeded
      try { await lastValueFrom(this.configService.refreshAppState()); } catch (e) {
        console.warn('refreshAppState failed after login', e);
      }
      this.loading.set(false);
      this.biometricLoading.set(false);
      await this.router.navigateByUrl('/');
      try { window.location.reload(); } catch { /* ignore */ }
      return;
    }

    // Fallback to legacy /api/account/login (non-credential errors only)
    console.warn('Resource-owner grant failed, falling back to /api/account/login', grantErr);
    const res = await lastValueFrom(this.loginSvc.login({ userNameOrEmailAddress: username, password }));

    // result: 1 = Success, 2 = InvalidUserNameOrPassword, 3+ = other failures
    if (!res || res.result !== 1) {
      if (res?.result === 2) {
        throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة / Invalid username or password');
      }
      throw new Error(res?.description || 'فشل تسجيل الدخول / Login failed');
    }

    try { await lastValueFrom(this.configService.refreshAppState()); } catch (e) {
      console.warn('refreshAppState failed after legacy login', e);
    }
    this.loading.set(false);
    this.biometricLoading.set(false);
    await this.router.navigateByUrl('/');
    try { window.location.reload(); } catch { /* ignore */ }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  updateUsername(value: string): void {
    this.model.update(m => ({ ...m, userNameOrEmailAddress: value }));
  }

  updatePassword(value: string): void {
    this.model.update(m => ({ ...m, password: value }));
  }

  updateRememberMe(value: boolean): void {
    this.model.update(m => ({ ...m, rememberMe: value }));
  }
}
