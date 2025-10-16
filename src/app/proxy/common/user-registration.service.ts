import type { RegisterUserDto, UserRegistrationResultDto, UserRegistrationTypeDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserRegistrationService {
  apiName = 'Default';
  

  getAvailableUserTypes = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationTypeDto[]>({
      method: 'GET',
      url: '/api/app/user-registration/available-user-types',
    },
    { apiName: this.apiName,...config });
  

  registerUser = (input: RegisterUserDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration/register-user',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
