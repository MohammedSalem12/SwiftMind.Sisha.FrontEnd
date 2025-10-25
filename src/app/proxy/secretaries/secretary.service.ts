import { Injectable } from '@angular/core';
import { RestService, Rest } from '@abp/ng.core';
import { Observable } from 'rxjs';
import type { PagedResultDto } from '@abp/ng.core';
import type { 
  SecretaryDto, 
  CreateUpdateSecretaryDto, 
  GetSecretariesInput,
  SecretaryLookupDto,
  SecretaryDashboardDto
} from './models';

@Injectable({
  providedIn: 'root',
})
export class SecretaryService {
  apiName = 'Default';
  
  constructor(private restService: RestService) {}

  get = (id: string, config?: Partial<Rest.Config>): Observable<SecretaryDto> =>
    this.restService.request<any, SecretaryDto>({
      method: 'GET',
      url: `/api/app/secretary/${id}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getList = (input: GetSecretariesInput, config?: Partial<Rest.Config>): Observable<PagedResultDto<SecretaryDto>> =>
    this.restService.request<any, PagedResultDto<SecretaryDto>>({
      method: 'GET',
      url: '/api/app/secretary',
      params: {
        keyword: input.keyword,
        department: input.department,
        isActive: input.isActive,
        userId: input.userId,
        sorting: input.sorting,
        skipCount: input.skipCount,
        maxResultCount: input.maxResultCount,
      },
      ...config,
    }, { apiName: this.apiName, ...config });

  create = (input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>): Observable<SecretaryDto> =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: '/api/app/secretary',
      body: input,
      ...config,
    }, { apiName: this.apiName, ...config });

  update = (id: string, input: CreateUpdateSecretaryDto, config?: Partial<Rest.Config>): Observable<SecretaryDto> =>
    this.restService.request<any, SecretaryDto>({
      method: 'PUT',
      url: `/api/app/secretary/${id}`,
      body: input,
      ...config,
    }, { apiName: this.apiName, ...config });

  delete = (id: string, config?: Partial<Rest.Config>): Observable<void> =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/secretary/${id}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  activate = (id: string, config?: Partial<Rest.Config>): Observable<SecretaryDto> =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: `/api/app/secretary/${id}/activate`,
      ...config,
    }, { apiName: this.apiName, ...config });

  deactivate = (id: string, config?: Partial<Rest.Config>): Observable<SecretaryDto> =>
    this.restService.request<any, SecretaryDto>({
      method: 'POST',
      url: `/api/app/secretary/${id}/deactivate`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getSecretaryLookup = (config?: Partial<Rest.Config>): Observable<SecretaryLookupDto[]> =>
    this.restService.request<any, SecretaryLookupDto[]>({
      method: 'GET',
      url: '/api/app/secretary/lookup',
      ...config,
    }, { apiName: this.apiName, ...config });

  getDashboard = (secretaryId: string, config?: Partial<Rest.Config>): Observable<SecretaryDashboardDto> =>
    this.restService.request<any, SecretaryDashboardDto>({
      method: 'GET',
      url: `/api/app/secretary/${secretaryId}/dashboard`,
      ...config,
    }, { apiName: this.apiName, ...config });
}