import type { StudentAcademicRecordDto, StudentAttendanceReportDto, StudentDashboardDto, StudentNotificationDto, StudentScheduleDto, StudentUpcomingExamDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentDashboardService {
  apiName = 'Default';
  

  getAcademicRecord = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentAcademicRecordDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/academic-record',
    },
    { apiName: this.apiName,...config });
  

  getAttendanceReport = (startDate?: string, endDate?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentAttendanceReportDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/attendance-report',
      params: { startDate, endDate },
    },
    { apiName: this.apiName,...config });
  

  getDashboard = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDashboardDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/dashboard',
    },
    { apiName: this.apiName,...config });
  

  getSchedule = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentScheduleDto>({
      method: 'GET',
      url: '/api/app/student-dashboard/schedule',
    },
    { apiName: this.apiName,...config });
  

  getStudentNotifications = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentNotificationDto[]>({
      method: 'GET',
      url: `/api/app/student-dashboard/student-notifications/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getUpcomingExams = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentUpcomingExamDto[]>({
      method: 'GET',
      url: `/api/app/student-dashboard/upcoming-exams/${studentId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
