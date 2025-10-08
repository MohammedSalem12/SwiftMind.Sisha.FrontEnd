import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from './login.service';
import { lastValueFrom } from 'rxjs';
import { AuthService, ConfigStateService } from '@abp/ng.core';
import { environment } from '../../environments/environment';

interface LoginModel {
  userNameOrEmailAddress?: string;
  password?: string;
  rememberMe?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly loginSvc = inject(LoginService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly configService = inject(ConfigStateService);

  model = signal<LoginModel>({ userNameOrEmailAddress: '', password: '', rememberMe: false });
  loading = signal(false);
  error = signal<string | null>(null);

  async submit() {
    this.error.set(null);
    this.loading.set(true);
    try {
      const payload = { ...this.model() } as any;

      // Prefer using ABP AuthService to obtain and store tokens so current user info is available
      try {
        const grantParams = {
          username: payload.userNameOrEmailAddress,
          password: payload.password,
          scope: environment.oAuthConfig?.scope ?? undefined,
          client_id: environment.oAuthConfig?.clientId ?? undefined,
        } as any;

        const token = await this.authService.loginUsingGrant('password', grantParams);
        // token received and stored internally by AuthService
        // refresh application state so currentUser and permissions are loaded
        try {
          await lastValueFrom(this.configService.refreshAppState());
        } catch (e) {
          console.warn('refreshAppState failed after login', e);
        }
  this.loading.set(false);
  // navigate to home so app components can pick up the authenticated state
  await this.router.navigateByUrl('/');
  // reload the page to force menu/provider re-evaluation (ensures login menu is hidden)
  try { window.location.reload(); } catch { /* ignore in non-browser env */ }
        return;
      } catch (grantErr) {
        // fall back to legacy login endpoint if grant is not enabled
        console.warn('Resource-owner grant failed, falling back to /api/account/login', grantErr);
      }

      // call the legacy login service as fallback
      const res = await lastValueFrom(this.loginSvc.login(payload));
      alert(res.description || 'تم تسجيل الدخول بنجاح');
      // refresh app state for legacy login as well
      try {
        await lastValueFrom(this.configService.refreshAppState());
      } catch (e) {
        console.warn('refreshAppState failed after legacy login', e);
      }
  this.loading.set(false);
  await this.router.navigateByUrl('/');
  try { window.location.reload(); } catch { /* ignore in non-browser env */ }
    } catch (err: any) {
      this.loading.set(false);
      const msg = err?.error?.error?.message || err?.message || 'خطأ في تسجيل الدخول';
      this.error.set(msg);
      console.error(err);
    }
  }
}
