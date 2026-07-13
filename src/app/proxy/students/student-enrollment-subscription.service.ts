import type { CreateEnrollmentSubscriptionDto, EnrollmentQuotaStatusDto, RejectEnrollmentSubscriptionDto, StudentEnrollmentSubscriptionDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentEnrollmentSubscriptionService {
  apiName = 'Default';
  

  approve = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentEnrollmentSubscriptionDto>({
      method: 'POST',
      url: `/api/app/student-enrollment-subscription/${id}/approve`,
    },
    { apiName: this.apiName,...config });
  

  getMyQuotaStatus = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentQuotaStatusDto>({
      method: 'GET',
      url: '/api/app/student-enrollment-subscription/my-quota-status',
    },
    { apiName: this.apiName,...config });
  

  getMySubscriptions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentEnrollmentSubscriptionDto[]>({
      method: 'GET',
      url: '/api/app/student-enrollment-subscription/my-subscriptions',
    },
    { apiName: this.apiName,...config });
  

  getPending = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<StudentEnrollmentSubscriptionDto>>({
      method: 'GET',
      url: '/api/app/student-enrollment-subscription/pending',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  reject = (id: string, input: RejectEnrollmentSubscriptionDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentEnrollmentSubscriptionDto>({
      method: 'POST',
      url: `/api/app/student-enrollment-subscription/${id}/reject`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  request = (input: CreateEnrollmentSubscriptionDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentEnrollmentSubscriptionDto>({
      method: 'POST',
      url: '/api/app/student-enrollment-subscription/request',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
