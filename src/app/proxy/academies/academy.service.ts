import { Injectable } from '@angular/core';
import { RestService } from '@abp/ng.core';
import { Observable, of } from 'rxjs';
import type { AcademyDto, AcademyMemberDto, CreateAcademyDto } from './models';

// Stub service — will be replaced when Academy backend is deployed and proxy regenerated
@Injectable({ providedIn: 'root' })
export class AcademyService {
  apiName = 'Default';
  constructor(private restService: RestService) {}

  getList = (input: any): Observable<any> =>
    this.restService.request<any, any>({ method: 'GET', url: '/api/sesha/academies', params: input }, { apiName: this.apiName });

  get = (id: string): Observable<AcademyDto> =>
    this.restService.request<any, AcademyDto>({ method: 'GET', url: `/api/sesha/academies/${id}` }, { apiName: this.apiName });

  create = (input: CreateAcademyDto): Observable<AcademyDto> =>
    this.restService.request<any, AcademyDto>({ method: 'POST', url: '/api/sesha/academies', body: input }, { apiName: this.apiName });

  getMyAcademy = (): Observable<AcademyDto | null> =>
    this.restService.request<any, AcademyDto>({ method: 'GET', url: '/api/sesha/academies/my-academy' }, { apiName: this.apiName, skipHandleError: true });

  getMyMembership = (): Observable<AcademyMemberDto | null> =>
    this.restService.request<any, AcademyMemberDto>({ method: 'GET', url: '/api/sesha/academies/my-membership' }, { apiName: this.apiName, skipHandleError: true });

  requestToJoin = (academyId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'POST', url: `/api/sesha/academies/${academyId}/join` }, { apiName: this.apiName });

  approveMembers = (academyId: string, teacherId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'POST', url: `/api/sesha/academies/${academyId}/approve/${teacherId}` }, { apiName: this.apiName });

  approveMember = (academyId: string, teacherId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'POST', url: `/api/sesha/academies/${academyId}/approve/${teacherId}` }, { apiName: this.apiName });

  rejectMember = (academyId: string, teacherId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'POST', url: `/api/sesha/academies/${academyId}/reject/${teacherId}` }, { apiName: this.apiName });

  createCourseForAcademy = (academyId: string, input: any): Observable<any> =>
    this.restService.request<any, any>({ method: 'POST', url: `/api/sesha/academies/${academyId}/courses`, body: input }, { apiName: this.apiName });

  getMembers = (academyId: string): Observable<AcademyMemberDto[]> =>
    this.restService.request<any, AcademyMemberDto[]>({ method: 'GET', url: `/api/sesha/academies/${academyId}/members` }, { apiName: this.apiName });

  getPendingRequests = (academyId: string): Observable<AcademyMemberDto[]> =>
    this.restService.request<any, AcademyMemberDto[]>({ method: 'GET', url: `/api/sesha/academies/${academyId}/pending-requests` }, { apiName: this.apiName });

  getAcademyCourses = (academyId: string): Observable<any[]> =>
    this.restService.request<any, any[]>({ method: 'GET', url: `/api/sesha/academies/${academyId}/courses` }, { apiName: this.apiName });

  addCourseToAcademy = (academyId: string, courseId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'POST', url: `/api/sesha/academies/${academyId}/courses/${courseId}` }, { apiName: this.apiName });

  removeCourseFromAcademy = (courseId: string): Observable<void> =>
    this.restService.request<any, void>({ method: 'DELETE', url: `/api/sesha/academies/courses/${courseId}` }, { apiName: this.apiName });
}
