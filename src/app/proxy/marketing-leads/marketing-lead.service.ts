import type { CreateUpdateMarketingLeadDto, GetMarketingLeadsInput, MarketingLeadDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MarketingLeadService {
  apiName = 'Default';
  

  create = (input: CreateUpdateMarketingLeadDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketingLeadDto>({
      method: 'POST',
      url: '/api/app/marketing-lead',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/marketing-lead/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketingLeadDto>({
      method: 'GET',
      url: `/api/app/marketing-lead/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: GetMarketingLeadsInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<MarketingLeadDto>>({
      method: 'GET',
      url: '/api/app/marketing-lead',
      params: { filter: input.filter, isCalled: input.isCalled, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  toggleCalled = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketingLeadDto>({
      method: 'POST',
      url: `/api/app/marketing-lead/${id}/toggle-called`,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateMarketingLeadDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketingLeadDto>({
      method: 'PUT',
      url: `/api/app/marketing-lead/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
