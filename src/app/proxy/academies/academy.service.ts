import type { AcademyCourseDto, AcademyCourseTeacherDto, AcademyDto, AcademyMemberDto, CreateAcademyDto, UpdateAcademyDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AcademyService {
  apiName = 'Default';
  

  addCourseToAcademy = (academyId: string, courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/course-to-academy',
      params: { academyId, courseId },
    },
    { apiName: this.apiName,...config });
  

  approveCourseTeacher = (academyId: string, courseId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/approve-course-teacher',
      params: { academyId, courseId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  approveMember = (academyId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/approve-member',
      params: { academyId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  assignTeacherToCourse = (academyId: string, courseId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/assign-teacher-to-course',
      params: { academyId, courseId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  create = (input: CreateAcademyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'POST',
      url: '/api/app/academy',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  get = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'GET',
      url: `/api/app/academy/${id}`,
    },
    { apiName: this.apiName,...config });
  

  getAcademyCourses = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyCourseDto[]>({
      method: 'GET',
      url: `/api/app/academy/academy-courses/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  getCourseTeachers = (academyId: string, courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyCourseTeacherDto[]>({
      method: 'GET',
      url: '/api/app/academy/course-teachers',
      params: { academyId, courseId },
    },
    { apiName: this.apiName,...config });
  

  getList = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto[]>({
      method: 'GET',
      url: '/api/app/academy',
    },
    { apiName: this.apiName,...config });
  

  getMembers = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto[]>({
      method: 'GET',
      url: `/api/app/academy/members/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  getMyAcademy = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'GET',
      url: '/api/app/academy/my-academy',
    },
    { apiName: this.apiName,...config });
  

  getMyAcademyCourseAssignments = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyCourseTeacherDto[]>({
      method: 'GET',
      url: `/api/app/academy/my-academy-course-assignments/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  getMyMembership = (academyId?: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto>({
      method: 'GET',
      url: '/api/app/academy/my-membership',
      params: { academyId },
    },
    { apiName: this.apiName,...config });
  

  getPendingCourseTeacherRequests = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyCourseTeacherDto[]>({
      method: 'GET',
      url: `/api/app/academy/pending-course-teacher-requests/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  getPendingJoinRequestsForMyAcademy = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto[]>({
      method: 'GET',
      url: '/api/app/academy/pending-join-requests-for-my-academy',
    },
    { apiName: this.apiName,...config });
  

  getPendingRequests = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyMemberDto[]>({
      method: 'GET',
      url: `/api/app/academy/pending-requests/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  rejectCourseTeacher = (academyId: string, courseId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/reject-course-teacher',
      params: { academyId, courseId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  rejectMember = (academyId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/reject-member',
      params: { academyId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  removeCourseFromAcademy = (courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/academy/course-from-academy/${courseId}`,
    },
    { apiName: this.apiName,...config });
  

  removeCourseTeacher = (academyId: string, courseId: string, teacherId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: '/api/app/academy/course-teacher',
      params: { academyId, courseId, teacherId },
    },
    { apiName: this.apiName,...config });
  

  requestToJoin = (academyId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/academy/request-to-join/${academyId}`,
    },
    { apiName: this.apiName,...config });
  

  requestToTeachCourse = (academyId: string, courseId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/request-to-teach-course',
      params: { academyId, courseId },
    },
    { apiName: this.apiName,...config });
  

  setActive = (id: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/academy/${id}/set-active`,
      params: { isActive },
    },
    { apiName: this.apiName,...config });
  

  setCourseActive = (academyId: string, courseId: string, isActive: boolean, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/academy/set-course-active',
      params: { academyId, courseId, isActive },
    },
    { apiName: this.apiName,...config });
  

  update = (id: string, input: UpdateAcademyDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AcademyDto>({
      method: 'PUT',
      url: `/api/app/academy/${id}`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
