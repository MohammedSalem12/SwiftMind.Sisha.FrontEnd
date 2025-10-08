import type { CreateUpdateEnrollmentDto, EnrollmentDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentEnrollmentService {
  apiName = 'Default';
  

  create = (input: CreateUpdateEnrollmentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentDto>({
      method: 'POST',
      url: '/api/app/student-enrollment',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/student-enrollment/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentDto>({
      method: 'GET',
      url: `/api/app/student-enrollment/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<EnrollmentDto>>({
      method: 'GET',
      url: '/api/app/student-enrollment',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateEnrollmentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, EnrollmentDto>({
      method: 'PUT',
      url: `/api/app/student-enrollment/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
