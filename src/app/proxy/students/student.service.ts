import type { CreateUpdateStudentDto, StudentDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { ParentStudentDto } from '../parents/models';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  apiName = 'Default';
  

  confirmParentStudentLink = (parentId: string, studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/student/confirm-parent-student-link',
      params: { parentId, studentId },
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'POST',
      url: '/api/app/student',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/student/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'GET',
      url: `/api/app/student/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getByStudentCode = (studentCode: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'GET',
      url: '/api/app/student/by-student-code',
      params: { studentCode },
    },
    { apiName: this.apiName,...config });
  

  getByTeacherStudentCode = (teacherStudentCode: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'GET',
      url: '/api/app/student/by-teacher-student-code',
      params: { teacherStudentCode },
    },
    { apiName: this.apiName,...config });
  

  getCurrentStudent = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'GET',
      url: '/api/app/student/current-student',
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<StudentDto>>({
      method: 'GET',
      url: '/api/app/student',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getPendingLinksForCurrentStudent = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentStudentDto[]>({
      method: 'GET',
      url: '/api/app/student/pending-links-for-current-student',
    },
    { apiName: this.apiName,...config });
  

  promoteToNextGrade = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'POST',
      url: `/api/app/student/promote-to-next-grade/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  rejectParentStudentLink = (parentId: string, studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/student/reject-parent-student-link',
      params: { parentId, studentId },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'PUT',
      url: `/api/app/student/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
