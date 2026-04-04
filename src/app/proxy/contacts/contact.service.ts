import type { ContactCheckInputDto, ContactCheckResultDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  apiName = 'Default';
  

  check = (input: ContactCheckInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ContactCheckResultDto>({
      method: 'POST',
      url: '/api/app/contact/check',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
