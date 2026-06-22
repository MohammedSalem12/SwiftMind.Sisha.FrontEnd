import type { CreateUpdateMarketerDto, MarketerAddScheduleDto, MarketerCreateCourseDto, MarketerCreateGroupDto, MarketerDto, MarketerRegisterSecretaryDto, MarketerRegistrationResultDto, MarketerStatsDto, MarketerTeacherDto, OnboardTeacherDto, RegisterMarketerDto, SetMarketerFeeDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MarketerService {
  apiName = 'Default';
  

  addSchedule = (input: MarketerAddScheduleDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/marketer/schedule',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateMarketerDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerDto>({
      method: 'POST',
      url: '/api/app/marketer',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  createCourseForTeacher = (input: MarketerCreateCourseDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'POST',
      responseType: 'text',
      url: '/api/app/marketer/course-for-teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  createGroupForTeacher = (input: MarketerCreateGroupDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'POST',
      responseType: 'text',
      url: '/api/app/marketer/group-for-teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  delete = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/marketer/${id}`,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerDto>({
      method: 'GET',
      url: `/api/app/marketer/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getAllStats = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerStatsDto[]>({
      method: 'GET',
      url: '/api/app/marketer/stats',
    },
    { apiName: this.apiName,...config });
  

  getByUserId = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerDto>({
      method: 'GET',
      url: `/api/app/marketer/by-user-id/${userId}`,
    },
    { apiName: this.apiName,...config });
  

  getList = (input: PagedAndSortedResultRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<MarketerDto>>({
      method: 'GET',
      url: '/api/app/marketer',
      params: { sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getMyStats = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerStatsDto>({
      method: 'GET',
      url: '/api/app/marketer/my-stats',
    },
    { apiName: this.apiName,...config });
  

  getMyTeachers = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerTeacherDto[]>({
      method: 'GET',
      url: '/api/app/marketer/my-teachers',
    },
    { apiName: this.apiName,...config });
  

  registerMarketer = (input: RegisterMarketerDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerRegistrationResultDto>({
      method: 'POST',
      url: '/api/app/marketer/register-marketer',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerSecretaryForTeacher = (input: MarketerRegisterSecretaryDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/marketer/register-secretary-for-teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  registerTeacher = (input: OnboardTeacherDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerTeacherDto>({
      method: 'POST',
      url: '/api/app/marketer/register-teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  setFeePerTeacher = (input: SetMarketerFeeDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/marketer/set-fee-per-teacher',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: CreateUpdateMarketerDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, MarketerDto>({
      method: 'PUT',
      url: `/api/app/marketer/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
