import type { CreateUpdateTeacherDto, TeacherDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CourseDto } from '../courses/dtos/models';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  apiName = 'Default';
  

  create = (input: CreateUpdateTeacherDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherDto>({
      method: 'POST',
      url: '/api/app/teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/teacher/${id}`,
    },
    { apiName: this.apiName,...config });
  

  enrollTeacherInCourses = (teacherId: string, courseIds: string[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/teacher/enroll-teacher-in-courses/${teacherId}`,
      body: courseIds,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherDto>({
      method: 'GET',
      url: `/api/app/teacher/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<TeacherDto>>({
      method: 'GET',
      url: '/api/app/teacher',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getTeacherCourses = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CourseDto[]>({
      method: 'GET',
      url: `/api/app/teacher/teacher-courses/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateTeacherDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherDto>({
      method: 'PUT',
      url: `/api/app/teacher/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
