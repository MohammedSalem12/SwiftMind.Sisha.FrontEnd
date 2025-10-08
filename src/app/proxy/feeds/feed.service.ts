import type { CreateUpdateFeedDto, FeedDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FeedService {
  apiName = 'Default';
  

  create = (input: CreateUpdateFeedDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedDto>({
      method: 'POST',
      url: '/api/app/feed',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/feed/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedDto>({
      method: 'GET',
      url: `/api/app/feed/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<FeedDto>>({
      method: 'GET',
      url: '/api/app/feed',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateFeedDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedDto>({
      method: 'PUT',
      url: `/api/app/feed/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
