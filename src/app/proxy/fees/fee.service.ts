import type { FeeFilterOptionsDto, FeeStudentRowDto, GetFeesInput, MarkFeeMonthInput, MarkWholeCourseInput } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FeeService {
  apiName = 'Default';
  

  getFilterOptions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeeFilterOptionsDto>({
      method: 'GET',
      url: '/api/app/fee/filter-options',
    },
    { apiName: this.apiName,...config });
  

  getStudents = (input: GetFeesInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeeStudentRowDto[]>({
      method: 'GET',
      url: '/api/app/fee/students',
      params: { courseId: input.courseId, groupId: input.groupId, year: input.year },
    },
    { apiName: this.apiName,...config });
  

  markMonth = (input: MarkFeeMonthInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/fee/mark-month',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  markWholeCourse = (input: MarkWholeCourseInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/fee/mark-whole-course',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
