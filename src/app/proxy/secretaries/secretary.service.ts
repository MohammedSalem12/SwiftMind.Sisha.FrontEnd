import type { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CreateUpdateSecretaryDto, GetSecretariesInput, SecretaryDto, SecretaryDashboardDto } from './models';

@Injectable({
  providedIn: 'root',
})
export class SecretaryService {
  apiName = 'Default';

  activate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/secretary/${id}/activate`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  create = (input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: '/api/app/secretary',
      body: input,
      ...config,
    },
    { apiName: this.apiName, ...config });

  deactivate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/secretary/${id}/deactivate`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/secretary/${id}`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'GET',
      url: `/api/app/secretary/${id}`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  getDashboard = (id?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDashboardDto>({
      method: 'GET',
      url: '/api/app/secretary/dashboard',
      params: { id },
      ...config,
    },
    { apiName: this.apiName, ...config });

  getList = (input: GetSecretariesInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<SecretaryDto>>({
      method: 'GET',
      url: '/api/app/secretary',
      params: { filter: input.filter, keyword: input.keyword, secretaryCode: input.secretaryCode, email: input.email, phoneNumber: input.phoneNumber, department: input.department, isActive: input.isActive, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
      ...config,
    },
    { apiName: this.apiName, ...config });

  update = (id: string, input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryDto>({
      method: 'PUT',
      url: `/api/app/secretary/${id}`,
      body: input,
      ...config,
    },
    { apiName: this.apiName, ...config });

  constructor(private restService: RestService) {}
}