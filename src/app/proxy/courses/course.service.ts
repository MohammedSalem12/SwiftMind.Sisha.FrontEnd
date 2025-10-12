import type { CourseDto, CreateUpdateCourseDto } from './dtos/models';
import type { CourseSimpleDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { ListResultDto, PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  apiName = 'Default';
  

  create = (input: CreateUpdateCourseDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CourseDto>({
      method: 'POST',
      url: '/api/app/course',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/course/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CourseDto>({
      method: 'GET',
      url: `/api/app/course/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CourseDto>>({
      method: 'GET',
      url: '/api/app/course',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getSimpleCourses = (search?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ListResultDto<CourseSimpleDto>>({
      method: 'GET',
      url: '/api/app/course/simple-courses',
      params: { search },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateCourseDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CourseDto>({
      method: 'PUT',
      url: `/api/app/course/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
