import type { CreateTeacherPromotionDto, PromotionPaymentInfoDto, PromotionPricingDto, TeacherPromotionDto, UpdatePromotionPaymentInfoDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TeacherPromotionService {
  apiName = 'Default';
  

  approve = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/teacher-promotion/${id}/approve`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateTeacherPromotionDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherPromotionDto>({
      method: 'POST',
      url: '/api/app/teacher-promotion',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getAllList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherPromotionDto[]>({
      method: 'GET',
      url: '/api/app/teacher-promotion/list',
    },
    { apiName: this.apiName,...config });
  

  getMyPromotions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherPromotionDto[]>({
      method: 'GET',
      url: '/api/app/teacher-promotion/my-promotions',
    },
    { apiName: this.apiName,...config });
  

  getPaymentInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, PromotionPaymentInfoDto>({
      method: 'GET',
      url: '/api/app/teacher-promotion/payment-info',
    },
    { apiName: this.apiName,...config });
  

  getPendingList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, TeacherPromotionDto[]>({
      method: 'GET',
      url: '/api/app/teacher-promotion/pending-list',
    },
    { apiName: this.apiName,...config });
  

  getPricing = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, PromotionPricingDto[]>({
      method: 'GET',
      url: '/api/app/teacher-promotion/pricing',
    },
    { apiName: this.apiName,...config });
  

  reject = (id: string, reason?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/teacher-promotion/${id}/reject`,
      params: { reason },
    },
    { apiName: this.apiName,...config });
  

  updatePaymentInfo = (input: UpdatePromotionPaymentInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/teacher-promotion/payment-info',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
