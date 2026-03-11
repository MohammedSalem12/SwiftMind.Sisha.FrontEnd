import type { CompleteSocialRegistrationDto, SocialRegistrationResultDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SocialRegistrationService {
  apiName = 'Default';
  

  complete = (input: CompleteSocialRegistrationDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, SocialRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/social-registration/complete',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
