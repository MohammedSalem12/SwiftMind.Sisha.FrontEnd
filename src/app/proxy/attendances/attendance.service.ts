import type { AttendanceDto, CreateUpdateAttendanceDto, GetAttendanceReportInput, AttendanceReportResultDto } from './dtos';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  apiName = 'Default';
  

  create = (input: CreateUpdateAttendanceDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AttendanceDto>({
      method: 'POST',
      url: '/api/app/attendance',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/attendance/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AttendanceDto>({
      method: 'GET',
      url: `/api/app/attendance/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AttendanceDto>>({
      method: 'GET',
      url: '/api/app/attendance',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getStudentAttendanceReport = (input: GetAttendanceReportInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AttendanceReportResultDto>({
      method: 'GET',
      url: '/api/app/attendance/student-attendance-report',
      params: { date: input.date, courseId: input.courseId, studentId: input.studentId, search: input.search, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateAttendanceDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AttendanceDto>({
      method: 'PUT',
      url: `/api/app/attendance/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
