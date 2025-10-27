import type { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { GetTeacherSecretaryDelegationsInput, TeacherSecretaryDelegationDto } from './models';

@Injectable({
  providedIn: 'root',
})
export class TeacherSecretaryDelegationService {
  apiName = 'Default';

  activate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/activate`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  deactivate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/deactivate`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      ...config,
    },
    { apiName: this.apiName, ...config });

  getList = (input: GetTeacherSecretaryDelegationsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TeacherSecretaryDelegationDto>>({
      method: 'GET',
      url: '/api/app/teacher-secretary-delegation',
      params: { teacherId: input.teacherId, secretaryId: input.secretaryId, delegationType: input.delegationType, keyword: input.keyword, isActive: input.isActive, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
      ...config,
    },
    { apiName: this.apiName, ...config });

  constructor(private restService: RestService) {}
}