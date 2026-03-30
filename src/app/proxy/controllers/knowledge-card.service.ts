import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class KnowledgeCardService {
  apiName = 'Default';
  

  getRandomBatchByCountAndTopicAndGrade = (count: number = 5, topic?: string, grade?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: '/api/knowledge-cards/random-batch',
      params: { count, topic, grade },
    },
    { apiName: this.apiName,...config });
  

  getRandomCardByTopicAndGrade = (topic?: string, grade?: number, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'GET',
      url: '/api/knowledge-cards/random',
      params: { topic, grade },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
