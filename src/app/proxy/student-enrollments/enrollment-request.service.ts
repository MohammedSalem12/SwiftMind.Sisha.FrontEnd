import type { EnrollmentRequestApproveDto, EnrollmentRequestCreateDto, EnrollmentRequestDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentRequestService {
  apiName = 'Default';
  

  approve = (input: EnrollmentRequestApproveDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentRequestDto>({
      method: 'POST',
      url: '/api/app/enrollment-request/approve',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  create = (input: EnrollmentRequestCreateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentRequestDto>({
      method: 'POST',
      url: '/api/app/enrollment-request',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentRequestDto[]>({
      method: 'GET',
      url: '/api/app/enrollment-request',
    },
    { apiName: this.apiName,...config });
  

  reject = (requestId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/enrollment-request/reject/${requestId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
