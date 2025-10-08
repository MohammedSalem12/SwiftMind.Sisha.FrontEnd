import { Injectable } from '@angular/core';
import { RestService, Rest } from '@abp/ng.core';
import type { Observable } from 'rxjs';

export interface UserLoginInfo {
  userNameOrEmailAddress: string;
  password: string;
  rememberMe?: boolean;
}

export interface AbpLoginResult {
  result?: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  apiName = 'AbpAccount';
  constructor(private restService: RestService) {}

  login(input: UserLoginInfo, config?: Partial<Rest.Config>): Observable<AbpLoginResult> {
    return this.restService.request<any, AbpLoginResult>({
      method: 'POST',
      url: '/api/account/login',
      body: input,
    }, { apiName: this.apiName, ...config });
  }
}
