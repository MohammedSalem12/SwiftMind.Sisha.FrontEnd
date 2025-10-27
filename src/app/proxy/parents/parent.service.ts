import type { CreateParentDto, CreateParentStudentDto, GetParentsInput, ParentDto, ParentLookupDto, ParentRegistrationResultDto, ParentStudentDto, RegisterParentDto, UpdateParentDto, UpdateParentStudentDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ParentService {
  apiName = 'Default';
  

  create = (input: CreateParentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'POST',
      url: '/api/app/parent',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  createParentFromUser = (userId: string, input: CreateParentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'POST',
      url: `/api/app/parent/parent-from-user/${userId}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/parent/${id}`,
    },
    { apiName: this.apiName,...config });
  

  enrollStudentToParent = (input: CreateParentStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto>({
      method: 'POST',
      url: '/api/app/parent/enroll-student-to-parent',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'GET',
      url: `/api/app/parent/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getByEmail = (email: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'GET',
      url: '/api/app/parent/by-email',
      params: { email },
    },
    { apiName: this.apiName,...config });
  

  getByParentCode = (parentCode: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'GET',
      url: '/api/app/parent/by-parent-code',
      params: { parentCode },
    },
    { apiName: this.apiName,...config });
  

  getByUserId = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'GET',
      url: `/api/app/parent/by-user-id/${userId}`,
    },
    { apiName: this.apiName,...config });
  

  getEmergencyContactsForStudent = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto[]>({
      method: 'GET',
      url: `/api/app/parent/emergency-contacts-for-student/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getLinkedStudentsByParentId = (parentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto[]>({
      method: 'GET',
      url: `/api/app/parent/linked-students-by-parent-id/${parentId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetParentsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ParentDto>>({
      method: 'GET',
      url: '/api/app/parent',
      params: { filter: input.filter, parentCode: input.parentCode, email: input.email, phoneNumber: input.phoneNumber, studentId: input.studentId, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getParentLookups = (input: GetParentsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ParentLookupDto>>({
      method: 'GET',
      url: '/api/app/parent/parent-lookups',
      params: { filter: input.filter, parentCode: input.parentCode, email: input.email, phoneNumber: input.phoneNumber, studentId: input.studentId, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getParentsByStudentId = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto[]>({
      method: 'GET',
      url: `/api/app/parent/parents-by-student-id/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getPickupAuthorizedForStudent = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto[]>({
      method: 'GET',
      url: `/api/app/parent/pickup-authorized-for-student/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  isParentCodeUnique = (parentCode: string, excludeId?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: '/api/app/parent/is-parent-code-unique',
      params: { parentCode, excludeId },
    },
    { apiName: this.apiName,...config });
  

  registerParent = (input: RegisterParentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/parent/register-parent',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  removeStudentFromParent = (parentId: string, studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/parent/student-from-parent',
      params: { parentId, studentId },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateParentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDto>({
      method: 'PUT',
      url: `/api/app/parent/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateParentStudentRelationship = (parentId: string, studentId: string, input: UpdateParentStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto>({
      method: 'PUT',
      url: '/api/app/parent/parent-student-relationship',
      params: { parentId, studentId },
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
