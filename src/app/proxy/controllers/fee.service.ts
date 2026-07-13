import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { FeeFilterOptionsDto, FeeStudentRowDto, GetFeesInput, MarkFeeMonthInput, MarkWholeCourseInput } from '../fees/models';

@Injectable({
  providedIn: 'root',
})
export class FeeService {
  apiName = 'Default';
  

  getFilterOptions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeeFilterOptionsDto>({
      method: 'GET',
      url: '/api/sesha/fees/filter-options',
    },
    { apiName: this.apiName,...config });
  

  getStudents = (input: GetFeesInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeeStudentRowDto[]>({
      method: 'GET',
      url: '/api/sesha/fees/students',
      params: { courseId: input.courseId, groupId: input.groupId, year: input.year },
    },
    { apiName: this.apiName,...config });
  

  markMonth = (input: MarkFeeMonthInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/sesha/fees/mark-month',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  markWholeCourse = (input: MarkWholeCourseInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/sesha/fees/mark-whole-course',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
