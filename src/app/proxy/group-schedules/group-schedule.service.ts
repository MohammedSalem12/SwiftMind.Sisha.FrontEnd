import { RestService, Rest } from '@abp/ng.core';
import type { ListResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { GroupScheduleDto } from '../groups/dtos/models';

@Injectable({
  providedIn: 'root',
})
export class GroupScheduleService {
  apiName = 'Default';
  

  getList = (groupId?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ListResultDto<GroupScheduleDto>>({
      method: 'GET',
      url: '/api/app/group-schedule',
      params: { groupId },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
