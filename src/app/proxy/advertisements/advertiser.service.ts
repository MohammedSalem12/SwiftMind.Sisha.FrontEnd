import type { AdvertiserDto, AdvertiserLookupDto, CreateUpdateAdvertiserDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdvertiserService {
  apiName = 'Default';
  

  approve = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertiser/${id}/approve`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateAdvertiserDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertiserDto>({
      method: 'POST',
      url: '/api/app/advertiser',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/advertiser/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertiserDto>({
      method: 'GET',
      url: `/api/app/advertiser/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AdvertiserDto>>({
      method: 'GET',
      url: '/api/app/advertiser',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getLookup = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertiserLookupDto[]>({
      method: 'GET',
      url: '/api/app/advertiser/lookup',
    },
    { apiName: this.apiName,...config });
  

  reject = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/advertiser/${id}/reject`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateAdvertiserDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AdvertiserDto>({
      method: 'PUT',
      url: `/api/app/advertiser/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
