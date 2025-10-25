import type { 
  CreateUpdateStudentDto, 
  StudentDto,
  StudentDashboardDto,
  StudentAcademicRecordDto,
  StudentAttendanceReportDto,
  StudentUpcomingExamDto,
  StudentNotificationDto,
  StudentScheduleDto
} from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  apiName = 'Default';
  

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
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<StudentDto>>({
      method: 'GET',
      url: '/api/app/student',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDto>({
      method: 'PUT',
      url: `/api/app/student/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  // Dashboard methods
  getDashboard = (config?: Partial<Rest.Config>): Observable<StudentDashboardDto> =>
    this.restService.request<any, StudentDashboardDto>({
      method: 'GET',
      url: '/api/app/student-dashboard',
      ...config,
    }, { apiName: this.apiName, ...config });

  getAcademicRecord = (config?: Partial<Rest.Config>): Observable<StudentAcademicRecordDto> =>
    this.restService.request<any, StudentAcademicRecordDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/academic-record',
      ...config,
    }, { apiName: this.apiName, ...config });

  getAttendanceReport = (startDate?: string, endDate?: string, config?: Partial<Rest.Config>): Observable<StudentAttendanceReportDto> =>
    this.restService.request<any, StudentAttendanceReportDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/attendance-report',
      params: { startDate, endDate },
      ...config,
    }, { apiName: this.apiName, ...config });

  getUpcomingExams = (studentId: string, config?: Partial<Rest.Config>): Observable<StudentUpcomingExamDto[]> =>
    this.restService.request<any, StudentUpcomingExamDto[]>({
      method: 'GET',
      url: `/api/app/student-dashboard/${studentId}/upcoming-exams`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getStudentNotifications = (studentId: string, config?: Partial<Rest.Config>): Observable<StudentNotificationDto[]> =>
    this.restService.request<any, StudentNotificationDto[]>({
      method: 'GET',
      url: `/api/app/student-dashboard/${studentId}/notifications`,
      ...config,
    }, { apiName: this.apiName, ...config });

  getSchedule = (config?: Partial<Rest.Config>): Observable<StudentScheduleDto> =>
    this.restService.request<any, StudentScheduleDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/schedule',
      ...config,
    }, { apiName: this.apiName, ...config });

  constructor(private restService: RestService) {}
}
