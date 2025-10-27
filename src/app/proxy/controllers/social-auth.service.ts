import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CompleteSocialRegistrationDto, SocialAuthResultDto, SocialAuthUrlDto, SocialLoginDto } from '../authentication/models';
import type { IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class SocialAuthService {
  apiName = 'Default';
  

  callbackByProviderAndReturnUrlAndStateAndCodeAndErrorAndError_description = (provider: string, returnUrl?: string, state?: string, code?: string, error?: string, error_description?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SocialAuthResultDto>({
      method: 'GET',
      url: '/api/social-auth/callback',
      params: { provider, returnUrl, state, code, error, error_description },
    },
    { apiName: this.apiName,...config });
  

  challengeByProviderAndReturnUrlAndState = (provider: string, returnUrl?: string, state?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: `/api/social-auth/challenge/${provider}`,
      params: { returnUrl, state },
    },
    { apiName: this.apiName,...config });
  

  completeRegistrationByInput = (input: CompleteSocialRegistrationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SocialAuthResultDto>({
      method: 'POST',
      url: '/api/social-auth/complete-registration',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getAuthUrlByProviderAndReturnUrl = (provider: string, returnUrl?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SocialAuthUrlDto>({
      method: 'GET',
      url: `/api/social-auth/auth-url/${provider}`,
      params: { returnUrl },
    },
    { apiName: this.apiName,...config });
  

  getProviders = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: '/api/social-auth/providers',
    },
    { apiName: this.apiName,...config });
  

  linkSocialAccountByProviderAndProviderId = (provider: string, providerId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/social-auth/link',
      params: { provider, providerId },
    },
    { apiName: this.apiName,...config });
  

  socialLoginByInput = (input: SocialLoginDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SocialAuthResultDto>({
      method: 'POST',
      url: '/api/social-auth/login',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  unlinkSocialAccountByProvider = (provider: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'DELETE',
      url: `/api/social-auth/unlink/${provider}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
