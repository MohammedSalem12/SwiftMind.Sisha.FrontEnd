import type { AdModuleSettingsDto, AdReviewDto, AdvertisementDto, CreateUpdateAdvertisementDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { AdTargetAudience } from '../enums/ad-target-audience.enum';
import type { AdType } from '../enums/ad-type.enum';

@Injectable({
  providedIn: 'root',
})
export class AdvertisementService {
  apiName = 'Default';
  

  create = (input: CreateUpdateAdvertisementDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertisementDto>({
      method: 'POST',
      url: '/api/app/advertisement',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/advertisement/${id}`,
    },
    { apiName: this.apiName,...config });
  

  disableAd = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertisement/${id}/disable-ad`,
    },
    { apiName: this.apiName,...config });
  

  enableAd = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertisement/${id}/enable-ad`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertisementDto>({
      method: 'GET',
      url: `/api/app/advertisement/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getActiveAds = (audience: AdTargetAudience, grade: number, adType: AdType, skipCount?: number, maxResultCount: number = 20, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AdvertisementDto>>({
      method: 'GET',
      url: '/api/app/advertisement/active-ads',
      params: { audience, grade, adType, skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AdvertisementDto>>({
      method: 'GET',
      url: '/api/app/advertisement',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getModuleSettings = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdModuleSettingsDto>({
      method: 'GET',
      url: '/api/app/advertisement/module-settings',
    },
    { apiName: this.apiName,...config });
  

  getMyAds = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertisementDto[]>({
      method: 'GET',
      url: '/api/app/advertisement/my-ads',
    },
    { apiName: this.apiName,...config });
  

  getPendingAds = (skipCount?: number, maxResultCount: number = 20, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AdvertisementDto>>({
      method: 'GET',
      url: '/api/app/advertisement/pending-ads',
      params: { skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  incrementClick = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertisement/${id}/increment-click`,
    },
    { apiName: this.apiName,...config });
  

  incrementView = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertisement/${id}/increment-view`,
    },
    { apiName: this.apiName,...config });
  

  reviewAd = (input: AdReviewDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/advertisement/review-ad',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  toggleFeatured = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertisement/${id}/toggle-featured`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateAdvertisementDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertisementDto>({
      method: 'PUT',
      url: `/api/app/advertisement/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateModuleSettings = (input: AdModuleSettingsDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/advertisement/module-settings',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
