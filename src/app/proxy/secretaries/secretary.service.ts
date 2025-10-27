import type { CreateUpdateSecretaryDto, GetSecretariesInput, SecretaryDashboardDto, SecretaryDto, SecretaryLookupDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecretaryService {
  apiName = 'Default';
  

  activate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: `/api/app/secretary/${id}/activate`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: '/api/app/secretary',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deactivate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: `/api/app/secretary/${id}/deactivate`,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/secretary/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'GET',
      url: `/api/app/secretary/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getDashboard = (secretaryId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDashboardDto>({
      method: 'GET',
      url: `/api/app/secretary/dashboard/${secretaryId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetSecretariesInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<SecretaryDto>>({
      method: 'GET',
      url: '/api/app/secretary',
      params: { keyword: input.keyword, department: input.department, isActive: input.isActive, userId: input.userId, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getSecretaryLookup = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryLookupDto[]>({
      method: 'GET',
      url: '/api/app/secretary/secretary-lookup',
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'PUT',
      url: `/api/app/secretary/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
