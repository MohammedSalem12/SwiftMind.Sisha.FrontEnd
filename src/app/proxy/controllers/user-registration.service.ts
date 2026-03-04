import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { RegisterUserDto, UserRegParentDto, UserRegSecretaryDto, UserRegStudentDto, UserRegTeacherDto, UserRegistrationResultDto, UserRegistrationTypeDto } from '../common/models';

@Injectable({
  providedIn: 'root',
})
export class UserRegistrationService {
  apiName = 'Default';
  

  getAvailableUserTypes = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationTypeDto[]>({
      method: 'GET',
      url: '/api/app/user-registration/types',
    },
    { apiName: this.apiName,...config });
  

  registerParent = (input: UserRegParentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration/parent',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerSecretary = (input: UserRegSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration/secretary',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerStudent = (input: UserRegStudentDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration/student',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerTeacher = (input: UserRegTeacherDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration/teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerUser = (input: RegisterUserDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, UserRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/user-registration',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
