import type { CreateUpdateExamDto, ExamDto, ExamWithDetailsDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  apiName = 'Default';
  

  create = (input: CreateUpdateExamDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamDto>({
      method: 'POST',
      url: '/api/app/exam',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/exam/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamDto>({
      method: 'GET',
      url: `/api/app/exam/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getExamsByCourse = (courseId: string, input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamDto>>({
      method: 'GET',
      url: `/api/app/exam/exams-by-course/${courseId}`,
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getExamsByGroup = (groupId: string, input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamDto>>({
      method: 'GET',
      url: `/api/app/exam/exams-by-group/${groupId}`,
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getExamsByTeacher = (teacherId: string, input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamDto>>({
      method: 'GET',
      url: `/api/app/exam/exams-by-teacher/${teacherId}`,
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamDto>>({
      method: 'GET',
      url: '/api/app/exam',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getListWithDetails = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamWithDetailsDto>>({
      method: 'GET',
      url: '/api/app/exam/with-details',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getWithDetails = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamWithDetailsDto>({
      method: 'GET',
      url: `/api/app/exam/${id}/with-details`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateExamDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamDto>({
      method: 'PUT',
      url: `/api/app/exam/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
