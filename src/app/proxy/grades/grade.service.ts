import type { GradeDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { ListResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  apiName = 'Default';
  

  getList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ListResultDto<GradeDto>>({
      method: 'GET',
      url: '/api/app/grade',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
