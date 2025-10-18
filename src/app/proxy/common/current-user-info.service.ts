import type { CurrentUserActorDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserInfoService {
  apiName = 'Default';
  

  getCurrentUserActorInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, CurrentUserActorDto>({
      method: 'GET',
      url: '/api/app/current-user/actor-info',
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
