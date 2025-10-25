import { Injectable } from '@angular/core';
import { RestService, Rest } from '@abp/ng.core';
import { Observable } from 'rxjs';
import type { PagedResultDto } from '@abp/ng.core';
import type { 
  TeacherSecretaryDelegationDto, 
  CreateUpdateTeacherSecretaryDelegationDto, 
  GetTeacherSecretaryDelegationsInput,
  DelegationPermissionUpdateDto
} from './models';

@Injectable({
  providedIn: 'root',
})
export class TeacherSecretaryDelegationService {
  apiName = 'Default';
  
  constructor(private restService: RestService) {}

  get = (id: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getList = (input: GetTeacherSecretaryDelegationsInput, config?: Partial<Rest.Config>): Observable<PagedResultDto<TeacherSecretaryDelegationDto>> =>
    this.restService.request<any, PagedResultDto<TeacherSecretaryDelegationDto>>({
      method: 'GET',
      url: '/api/app/teacher-secretary-delegation',
      params: {
        teacherId: input.teacherId,
        secretaryId: input.secretaryId,
        isActive: input.isActive,
        startDate: input.startDate,
        endDate: input.endDate,
        keyword: input.keyword,
        sorting: input.sorting,
        skipCount: input.skipCount,
        maxResultCount: input.maxResultCount,
      },
      ...config,
    }, { apiName: this.apiName, ...config });

  create = (input: CreateUpdateTeacherSecretaryDelegationDto, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: '/api/app/teacher-secretary-delegation',
      body: input,
      ...config,
    }, { apiName: this.apiName, ...config });

  update = (id: string, input: CreateUpdateTeacherSecretaryDelegationDto, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'PUT',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      body: input,
      ...config,
    }, { apiName: this.apiName, ...config });

  delete = (id: string, config?: Partial<Rest.Config>): Observable<void> =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/teacher-secretary-delegation/${id}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  activate = (id: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/activate`,
      ...config,
    }, { apiName: this.apiName, ...config });

  deactivate = (id: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'POST',
      url: `/api/app/teacher-secretary-delegation/${id}/deactivate`,
      ...config,
    }, { apiName: this.apiName, ...config });

  updatePermissions = (input: DelegationPermissionUpdateDto, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto> =>
    this.restService.request<any, TeacherSecretaryDelegationDto>({
      method: 'PUT',
      url: `/api/app/teacher-secretary-delegation/permissions`,
      body: input,
      ...config,
    }, { apiName: this.apiName, ...config });

  getByTeacher = (teacherId: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto[]> =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/by-teacher/${teacherId}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getBySecretary = (secretaryId: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto[]> =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/by-secretary/${secretaryId}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  hasPermission = (teacherId: string, secretaryId: string, permissionType: string, config?: Partial<Rest.Config>): Observable<boolean> =>
    this.restService.request<any, boolean>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/has-permission/${teacherId}/${secretaryId}`,
      params: { permissionType },
      ...config,
    }, { apiName: this.apiName, ...config });

  getActiveForTeacher = (teacherId: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto[]> =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/active-for-teacher/${teacherId}`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getActiveForSecretary = (secretaryId: string, config?: Partial<Rest.Config>): Observable<TeacherSecretaryDelegationDto[]> =>
    this.restService.request<any, TeacherSecretaryDelegationDto[]>({
      method: 'GET',
      url: `/api/app/teacher-secretary-delegation/active-for-secretary/${secretaryId}`,
      ...config,
    }, { apiName: this.apiName, ...config });
}