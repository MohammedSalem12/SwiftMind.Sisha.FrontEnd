import type { AcademyRatingDto, AcademyRatingSummaryDto, CreateUpdateAcademyRatingDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AcademyRatingService {
  apiName = 'Default';
  

  deleteMyRating = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/academy-rating/my-rating/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  getSummary = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyRatingSummaryDto>({
      method: 'GET',
      url: `/api/app/academy-rating/summary/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  rate = (input: CreateUpdateAcademyRatingDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyRatingDto>({
      method: 'POST',
      url: '/api/app/academy-rating/rate',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
