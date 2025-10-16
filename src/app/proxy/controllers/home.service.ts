import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { DashboardSummaryDto, HomeStatsDto } from '../home/models';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  apiName = 'Default';
  

  getCoursesCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/courses/count',
    },
    { apiName: this.apiName,...config });
  

  getDashboardSummary = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, DashboardSummaryDto>({
      method: 'GET',
      url: '/api/app/home/dashboard',
    },
    { apiName: this.apiName,...config });
  

  getEnrollmentsCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/enrollments/count',
    },
    { apiName: this.apiName,...config });
  

  getExamGradesCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/exam-grades/count',
    },
    { apiName: this.apiName,...config });
  

  getExamsCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/exams/count',
    },
    { apiName: this.apiName,...config });
  

  getGroupsCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/groups/count',
    },
    { apiName: this.apiName,...config });
  

  getHomeStats = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, HomeStatsDto>({
      method: 'GET',
      url: '/api/app/home/stats',
    },
    { apiName: this.apiName,...config });
  

  getParentsCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/parents/count',
    },
    { apiName: this.apiName,...config });
  

  getStudentsCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/students/count',
    },
    { apiName: this.apiName,...config });
  

  getTeachersCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/home/teachers/count',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
