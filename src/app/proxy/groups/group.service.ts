import type { EditGroupDto, EditGroupScheduleDto, GroupScheduleDto, GroupWithSchedulesDto } from './dtos/models';
import type { CreateUpdateGroupDto, GroupDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import type { ListResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  apiName = 'Default';
  

  addScheduleToGroup = (groupId: string, input: EditGroupScheduleDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupScheduleDto>({
      method: 'POST',
      url: `/api/app/group/schedule-to-group/${groupId}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateUpdateGroupDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupDto>({
      method: 'POST',
      url: '/api/app/group',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  deleteSchedule = (scheduleId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/group/schedule/${scheduleId}`,
    },
    { apiName: this.apiName,...config });
  

  getGroupsByCourseAndTeacher = (courseId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupWithSchedulesDto[]>({
      method: 'GET',
      url: '/api/app/group/groups-by-course-and-teacher',
      params: { courseId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  getList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ListResultDto<GroupDto>>({
      method: 'GET',
      url: '/api/app/group',
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: EditGroupDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupDto>({
      method: 'PUT',
      url: `/api/app/group/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });
  

  updateSchedule = (scheduleId: string, input: EditGroupScheduleDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupScheduleDto>({
      method: 'PUT',
      url: `/api/app/group/schedule/${scheduleId}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
