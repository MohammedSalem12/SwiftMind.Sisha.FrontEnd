import type { CreateSecretaryTeacherDto, SecretaryInfoDto, SecretaryTeacherDto, SecretaryTeacherRequestDto, SecretaryUserSearchResultDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecretaryTeacherService {
  apiName = 'Default';
  

  approveRequest = (requestId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto>({
      method: 'POST',
      url: `/api/app/secretary-teacher/approve-request/${requestId}`,
    },
    { apiName: this.apiName,...config });
  

  assignTeacherToSecretary = (input: CreateSecretaryTeacherDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherDto>({
      method: 'POST',
      url: '/api/app/secretary-teacher/assign-teacher-to-secretary',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getAllRequestsForCurrentTeacher = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto[]>({
      method: 'GET',
      url: '/api/app/secretary-teacher/requests-for-current-teacher',
    },
    { apiName: this.apiName,...config });
  

  getMyRequestsAsSecretary = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto[]>({
      method: 'GET',
      url: '/api/app/secretary-teacher/my-requests-as-secretary',
    },
    { apiName: this.apiName,...config });
  

  getPendingRequestsForCurrentTeacher = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto[]>({
      method: 'GET',
      url: '/api/app/secretary-teacher/pending-requests-for-current-teacher',
    },
    { apiName: this.apiName,...config });
  

  getSecretariesForCurrentTeacher = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryInfoDto[]>({
      method: 'GET',
      url: '/api/app/secretary-teacher/secretaries-for-current-teacher',
    },
    { apiName: this.apiName,...config });
  

  getTeacherIdsForSecretary = (secretaryUserId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string[]>({
      method: 'GET',
      url: `/api/app/secretary-teacher/teacher-ids-for-secretary/${secretaryUserId}`,
    },
    { apiName: this.apiName,...config });
  

  getTeachersForCurrentSecretary = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherDto[]>({
      method: 'GET',
      url: '/api/app/secretary-teacher/teachers-for-current-secretary',
    },
    { apiName: this.apiName,...config });
  

  linkCurrentSecretaryToTeacher = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherDto>({
      method: 'POST',
      url: `/api/app/secretary-teacher/link-current-secretary-to-teacher/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  linkSecretaryToCurrentTeacher = (secretaryUserId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherDto>({
      method: 'POST',
      url: `/api/app/secretary-teacher/link-secretary-to-current-teacher/${secretaryUserId}`,
    },
    { apiName: this.apiName,...config });
  

  rejectRequest = (requestId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto>({
      method: 'POST',
      url: `/api/app/secretary-teacher/reject-request/${requestId}`,
    },
    { apiName: this.apiName,...config });
  

  removeTeacherFromSecretary = (secretaryUserId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/secretary-teacher/teacher-from-secretary',
      params: { secretaryUserId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  searchSecretaryUsers = (query: string, maxResults: number = 10, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryUserSearchResultDto[]>({
      method: 'POST',
      url: '/api/app/secretary-teacher/search-secretary-users',
      params: { query, maxResults },
    },
    { apiName: this.apiName,...config });
  

  sendLinkRequest = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SecretaryTeacherRequestDto>({
      method: 'POST',
      url: `/api/app/secretary-teacher/send-link-request/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  unlinkSecretaryFromCurrentTeacher = (secretaryUserId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/secretary-teacher/unlink-secretary-from-current-teacher/${secretaryUserId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
