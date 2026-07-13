import type { ChildSubscriptionPaymentInfoDto, ChildSubscriptionPricingDto, CreateParentChildSubscriptionDto, ParentChildLinkStatusDto, ParentChildPaidLinkSettingsDto, ParentChildSubscriptionDto, UpdateParentChildPaidLinkSettingsDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ParentChildSubscriptionService {
  apiName = 'Default';
  

  approve = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/parent-child-subscription/${id}/approve`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateParentChildSubscriptionDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildSubscriptionDto>({
      method: 'POST',
      url: '/api/app/parent-child-subscription',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  getAllList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildSubscriptionDto[]>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/list',
    },
    { apiName: this.apiName,...config });
  

  getFeatureSettings = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildPaidLinkSettingsDto>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/feature-settings',
    },
    { apiName: this.apiName,...config });
  

  getMyChildLinkStatus = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildLinkStatusDto>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/my-child-link-status',
    },
    { apiName: this.apiName,...config });
  

  getMySubscriptions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildSubscriptionDto[]>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/my-subscriptions',
    },
    { apiName: this.apiName,...config });
  

  getPaymentInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildSubscriptionPaymentInfoDto>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/payment-info',
    },
    { apiName: this.apiName,...config });
  

  getPendingList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ParentChildSubscriptionDto[]>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/pending-list',
    },
    { apiName: this.apiName,...config });
  

  getPricing = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ChildSubscriptionPricingDto[]>({
      method: 'GET',
      url: '/api/app/parent-child-subscription/pricing',
    },
    { apiName: this.apiName,...config });
  

  reject = (id: string, reason?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/parent-child-subscription/${id}/reject`,
      params: { reason },
    },
    { apiName: this.apiName,...config });
  

  updateFeatureSettings = (input: UpdateParentChildPaidLinkSettingsDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/parent-child-subscription/feature-settings',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updatePaymentInfo = (input: ChildSubscriptionPaymentInfoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/parent-child-subscription/payment-info',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
