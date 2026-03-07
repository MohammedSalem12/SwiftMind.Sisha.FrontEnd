import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { AcademyCourseDto, AcademyDto, AcademyMemberDto, CreateAcademyDto } from '../academies/models';

@Injectable({
  providedIn: 'root',
})
export class AcademyService {
  apiName = 'Default';
  

  addCourseToAcademy = (academyId: string, courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/sesha/academies/${academyId}/courses/${courseId}`,
    },
    { apiName: this.apiName,...config });
  

  approveMember = (academyId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/sesha/academies/${academyId}/approve/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateAcademyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'POST',
      url: '/api/sesha/academies',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'GET',
      url: `/api/sesha/academies/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getAcademyCourses = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyCourseDto[]>({
      method: 'GET',
      url: `/api/sesha/academies/${academyId}/courses`,
    },
    { apiName: this.apiName,...config });
  

  getList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto[]>({
      method: 'GET',
      url: '/api/sesha/academies',
    },
    { apiName: this.apiName,...config });
  

  getMembers = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto[]>({
      method: 'GET',
      url: `/api/sesha/academies/${academyId}/members`,
    },
    { apiName: this.apiName,...config });
  

  getMyAcademy = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'GET',
      url: '/api/sesha/academies/my-academy',
    },
    { apiName: this.apiName,...config });
  

  getMyMembership = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto>({
      method: 'GET',
      url: '/api/sesha/academies/my-membership',
    },
    { apiName: this.apiName,...config });
  

  getPendingRequests = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto[]>({
      method: 'GET',
      url: `/api/sesha/academies/${academyId}/pending-requests`,
    },
    { apiName: this.apiName,...config });
  

  rejectMember = (academyId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/sesha/academies/${academyId}/reject/${teacherId}`,
    },
    { apiName: this.apiName,...config });
  

  removeCourseFromAcademy = (courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/sesha/academies/courses/${courseId}`,
    },
    { apiName: this.apiName,...config });
  

  requestToJoin = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/sesha/academies/${academyId}/join`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
