import type { AttendanceReportResultDto, BulkSetAttendanceStatusInput, GetAttendanceReportInput, GetStudentAttendanceStatusInput, GroupSessionDto, MyTodaySessionDto, ScanAttendanceQrInput, SelfCheckInInput, SetAttendanceStatusInput, StartSessionInput, StudentAttendanceStatusDto } from './dtos/models';
import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  apiName = 'Default';
  

  bulkSetStatus = (input: BulkSetAttendanceStatusInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: '/api/app/attendance/bulk-set-status',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  confirmAllSelfReported = (groupSessionId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: `/api/app/attendance/confirm-all-self-reported/${groupSessionId}`,
    },
    { apiName: this.apiName,...config });
  

  getMyTodaySessions = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, MyTodaySessionDto[]>({
      method: 'GET',
      url: '/api/app/attendance/my-today-sessions',
    },
    { apiName: this.apiName,...config });
  

  getStudentAttendanceReport = (input: GetAttendanceReportInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, AttendanceReportResultDto>({
      method: 'GET',
      url: '/api/app/attendance/student-attendance-report',
      params: { date: input.date, courseId: input.courseId, studentId: input.studentId, search: input.search, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getStudentAttendanceStatus = (input: GetStudentAttendanceStatusInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<StudentAttendanceStatusDto>>({
      method: 'GET',
      url: '/api/app/attendance/student-attendance-status',
      params: { date: input.date, studentCode: input.studentCode, courseId: input.courseId, teacherId: input.teacherId, groupId: input.groupId, search: input.search, sorting: input.sorting, skipCount: input.skipCount, maxResultCount: input.maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  isStudentAbsent = (enrollmentId: string, date: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, boolean>({
      method: 'POST',
      url: `/api/app/attendance/is-student-absent/${enrollmentId}`,
      params: { date },
    },
    { apiName: this.apiName,...config });
  

  rejectAllSelfReported = (groupSessionId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'POST',
      url: `/api/app/attendance/reject-all-self-reported/${groupSessionId}`,
    },
    { apiName: this.apiName,...config });
  

  scanQr = (input: ScanAttendanceQrInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentAttendanceStatusDto>({
      method: 'POST',
      url: '/api/app/attendance/scan-qr',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  selfCheckIn = (input: SelfCheckInInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentAttendanceStatusDto>({
      method: 'POST',
      url: '/api/app/attendance/self-check-in',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  setStatus = (input: SetAttendanceStatusInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentAttendanceStatusDto>({
      method: 'POST',
      url: '/api/app/attendance/set-status',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  startSession = (input: StartSessionInput, config?: Partial<Rest.Config>) =>
    this.restService.request<any, GroupSessionDto>({
      method: 'POST',
      url: '/api/app/attendance/start-session',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
