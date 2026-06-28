import type { CurrentUserActorDto, UpdateUserPhotoDto } from './models';
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
  

  updateMyPhoto = (input: UpdateUserPhotoDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'PUT',
      url: '/api/app/current-user/my-photo',
      params: { photoUrl: input.photoUrl },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
