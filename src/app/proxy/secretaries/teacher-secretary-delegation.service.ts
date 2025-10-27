import type { CreateUpdateTeacherSecretaryDelegationDto, DelegationPermissionUpdateDto, GetTeacherSecretaryDelegationsInput, TeacherSecretaryDelegationDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TeacherSecretaryDelegationService {
  apiName = 'Default';
  

  activate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/activate`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateTeacherSecretaryDelegationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: '/api/app/teacher-secretary-delegation',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deactivate = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/deactivate`,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/teacher-secretary-delegation/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveForSecretary = (secretaryId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/active-for-secretary/${secretaryId}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveForTeacher = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/active-for-teacher/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  getBySecretary = (secretaryId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/by-secretary/${secretaryId}`,
    },
    { apiName: this.apiName,...config });
  

  getByTeacher = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/by-teacher/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetTeacherSecretaryDelegationsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TeacherSecretaryDelegationDto>>({
      method: 'GET',
      url: '/api/app/teacher-secretary-delegation',
      params: { teacherId: input.teacherId, secretaryId: input.secretaryId, isActive: input.isActive, startDate: input.startDate, endDate: input.endDate, keyword: input.keyword, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  hasPermission = (teacherId: string, secretaryId: string, permissionType: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/teacher-secretary-delegation/has-permission',
      params: { teacherId, secretaryId, permissionType },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateTeacherSecretaryDelegationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'PUT',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updatePermissions = (input: DelegationPermissionUpdateDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'PUT',
      url: '/api/app/teacher-secretary-delegation/permissions',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
