import type { NotificationDto, ParentDashboardDto, StudentComparisonDto, StudentDetailedReportDto, StudentProgressDto, UpcomingExamDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ParentDashboardService {
  apiName = 'Default';
  

  getDashboard = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentDashboardDto>({
      method: 'GET',
      url: '/api/app/parent-dashboard/dashboard',
    },
    { apiName: this.apiName,...config });
  

  getRecentNotifications = (parentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, NotificationDto[]>({
      method: 'GET',
      url: `/api/app/parent-dashboard/recent-notifications/${parentId}`,
    },
    { apiName: this.apiName,...config });
  

  getStudentDetailedReport = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentDetailedReportDto>({
      method: 'GET',
      url: `/api/app/parent-dashboard/student-detailed-report/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getStudentProgress = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentProgressDto>({
      method: 'GET',
      url: `/api/app/parent-dashboard/student-progress/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getStudentsComparison = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentComparisonDto[]>({
      method: 'GET',
      url: '/api/app/parent-dashboard/students-comparison',
    },
    { apiName: this.apiName,...config });
  

  getUpcomingExams = (studentIds: string[], config?: Partial<Rest.Config>) =>
    this.restService.request<any, UpcomingExamDto[]>({
      method: 'GET',
      url: '/api/app/parent-dashboard/upcoming-exams',
      params: { studentIds },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
