import type { CreateUpdateTeacherRatingDto, TeacherRatingDto, TeacherRatingSummaryDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TeacherRatingService {
  apiName = 'Default';
  

  deleteMyRating = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/teacher-rating/my-rating/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  getSummary = (teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherRatingSummaryDto>({
      method: 'GET',
      url: `/api/app/teacher-rating/summary/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  rate = (input: CreateUpdateTeacherRatingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherRatingDto>({
      method: 'POST',
      url: '/api/app/teacher-rating/rate',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
