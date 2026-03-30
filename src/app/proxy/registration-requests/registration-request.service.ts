import type { RegistrationRequestDto, RejectRegistrationRequestDto } from './models';
import type { RegistrationRequestStatus } from './registration-request-status.enum';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrationRequestService {
  apiName = 'Default';
  

  approve = (requestId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RegistrationRequestDto>({
      method: 'POST',
      url: `/api/app/registration-request/approve/${requestId}`,
    },
    { apiName: this.apiName,...config });
  

  getAllRequests = (status?: RegistrationRequestStatus, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RegistrationRequestDto[]>({
      method: 'GET',
      url: '/api/app/registration-request/requests',
      params: { status },
    },
    { apiName: this.apiName,...config });
  

  getMyRequestStatus = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, RegistrationRequestDto>({
      method: 'GET',
      url: '/api/app/registration-request/my-request-status',
    },
    { apiName: this.apiName,...config });
  

  getPendingRequests = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, RegistrationRequestDto[]>({
      method: 'GET',
      url: '/api/app/registration-request/pending-requests',
    },
    { apiName: this.apiName,...config });
  

  reject = (requestId: string, input: RejectRegistrationRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, RegistrationRequestDto>({
      method: 'POST',
      url: `/api/app/registration-request/reject/${requestId}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
