import type { RegisterDeviceTokenDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceTokenService {
  apiName = 'Default';
  

  register = (input: RegisterDeviceTokenDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/device-token/register',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  unregister = (token: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/device-token/unregister',
      params: { token },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
