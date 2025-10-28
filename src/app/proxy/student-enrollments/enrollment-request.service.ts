import type { EnrollmentRequestApproveDto, EnrollmentRequestCreateDto, EnrollmentRequestDto, EnrollmentRequestRejectDto } from './models';
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
  

  getMyRequests = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentRequestDto[]>({
      method: 'GET',
      url: '/api/app/enrollment-request/my-requests',
    },
    { apiName: this.apiName,...config });
  

  getPendingRequestsForTeacher = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentRequestDto[]>({
      method: 'GET',
      url: '/api/app/enrollment-request/pending-requests-for-teacher',
    },
    { apiName: this.apiName,...config });
  

  reject = (input: EnrollmentRequestRejectDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/enrollment-request/reject',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
