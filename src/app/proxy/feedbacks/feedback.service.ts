import type { CreateUpdateFeedbackDto, FeedbackDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  apiName = 'Default';
  

  create = (input: CreateUpdateFeedbackDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedbackDto>({
      method: 'POST',
      url: '/api/app/feedback',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/feedback/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedbackDto>({
      method: 'GET',
      url: `/api/app/feedback/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<FeedbackDto>>({
      method: 'GET',
      url: '/api/app/feedback',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateFeedbackDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, FeedbackDto>({
      method: 'PUT',
      url: `/api/app/feedback/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
