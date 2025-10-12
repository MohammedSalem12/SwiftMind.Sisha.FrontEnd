import type { CreateUpdateExamGradeDto, ExamGradeDto, ExamGradeWithDetailsDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExamGradeService {
  apiName = 'Default';
  

  create = (input: CreateUpdateExamGradeDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto>({
      method: 'POST',
      url: '/api/app/exam-grade',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/exam-grade/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto>({
      method: 'GET',
      url: `/api/app/exam-grade/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getGradesByEnrollment = (enrollmentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto[]>({
      method: 'GET',
      url: `/api/app/exam-grade/grades-by-enrollment/${enrollmentId}`,
    },
    { apiName: this.apiName,...config });
  

  getGradesByExam = (examId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto[]>({
      method: 'GET',
      url: `/api/app/exam-grade/grades-by-exam/${examId}`,
    },
    { apiName: this.apiName,...config });
  

  getGradesByStudent = (studentId: string, input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamGradeDto>>({
      method: 'GET',
      url: `/api/app/exam-grade/grades-by-student/${studentId}`,
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getLastTwoByStudent = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto[]>({
      method: 'GET',
      url: `/api/app/exam-grade/last-two-by-student/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamGradeDto>>({
      method: 'GET',
      url: '/api/app/exam-grade',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getListWithDetails = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<ExamGradeWithDetailsDto>>({
      method: 'GET',
      url: '/api/app/exam-grade/with-details',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getWithDetails = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeWithDetailsDto>({
      method: 'GET',
      url: `/api/app/exam-grade/${id}/with-details`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateExamGradeDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ExamGradeDto>({
      method: 'PUT',
      url: `/api/app/exam-grade/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
