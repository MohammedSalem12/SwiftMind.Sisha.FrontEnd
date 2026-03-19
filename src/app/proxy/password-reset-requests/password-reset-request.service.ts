import type { CreatePasswordResetRequestDto, PasswordResetRequestDto, ResolvePasswordResetDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetRequestService {
  apiName = 'Default';
  

  create = (input: CreatePasswordResetRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PasswordResetRequestDto>({
      method: 'POST',
      url: '/api/app/password-reset-request',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getPendingList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, PasswordResetRequestDto[]>({
      method: 'GET',
      url: '/api/app/password-reset-request/pending-list',
    },
    { apiName: this.apiName,...config });
  

  reject = (id: string, notes?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/password-reset-request/${id}/reject`,
      params: { notes },
    },
    { apiName: this.apiName,...config });
  

  resolve = (id: string, input: ResolvePasswordResetDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/password-reset-request/${id}/resolve`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
