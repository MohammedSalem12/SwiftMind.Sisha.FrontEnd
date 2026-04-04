import type { ShareKnowledgeCardDto, SharedKnowledgeCardDto, UserSearchResultDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedKnowledgeCardService {
  apiName = 'Default';
  

  getSharedWithMe = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, SharedKnowledgeCardDto[]>({
      method: 'GET',
      url: '/api/app/shared-knowledge-card/shared-with-me',
    },
    { apiName: this.apiName,...config });
  

  markAsRead = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/shared-knowledge-card/${id}/mark-as-read`,
    },
    { apiName: this.apiName,...config });
  

  searchUsers = (query: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserSearchResultDto[]>({
      method: 'POST',
      url: '/api/app/shared-knowledge-card/search-users',
      params: { query },
    },
    { apiName: this.apiName,...config });
  

  share = (input: ShareKnowledgeCardDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SharedKnowledgeCardDto>({
      method: 'POST',
      url: '/api/app/shared-knowledge-card/share',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
