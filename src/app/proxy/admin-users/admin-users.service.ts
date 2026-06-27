import type { AdminUserDto, AdminUserListInput, SetUserPasswordDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  apiName = 'Default';
  

  getUsers = (input: AdminUserListInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<AdminUserDto>>({
      method: 'GET',
      url: '/api/app/admin-users/users',
      params: { filter: input.filter, role: input.role, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  setPassword = (userId: string, input: SetUserPasswordDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/admin-users/set-password/${userId}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
