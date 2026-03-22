import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@abp/ng.core';
import { RegisterModalService } from './register-modal.service';

const REDIRECT_KEY = 'kai_auth_redirect';

@Injectable({ providedIn: 'root' })
export class AuthRedirectService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly registerModal = inject(RegisterModalService);

  /** Check if user is authenticated */
  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated;
  }

  /** Show fancy modal instead of direct redirect */
  promptRegister(intendedUrl?: string): void {
    const url = intendedUrl || this.router.url;
    localStorage.setItem(REDIRECT_KEY, url);
    this.registerModal.show();
  }

  /** Save current URL and redirect to register */
  redirectToRegister(intendedUrl?: string): void {
    const url = intendedUrl || this.router.url;
    localStorage.setItem(REDIRECT_KEY, url);
    this.router.navigate(['/register']);
  }

  /** Save current URL and redirect to login */
  redirectToLogin(intendedUrl?: string): void {
    const url = intendedUrl || this.router.url;
    localStorage.setItem(REDIRECT_KEY, url);
    this.router.navigate(['/login']);
  }

  /** Get and clear the saved redirect URL */
  consumeRedirectUrl(): string | null {
    const url = localStorage.getItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    return url;
  }

  /** Check if there is a pending redirect */
  hasPendingRedirect(): boolean {
    return !!localStorage.getItem(REDIRECT_KEY);
  }
}
