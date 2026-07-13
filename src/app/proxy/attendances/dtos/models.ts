import type { EntityDto, ExtensibleEntityDto, PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';
import type { AttendanceStatus } from '../../enums/attendance-status.enum';

export interface AttendanceReportResultDto extends PagedResultDto<StudentAttendanceReportDto> {
}

export interface BulkSetAttendanceStatusInput {
  groupSessionId: string;
  status: AttendanceStatus;
  enrollmentIds: string[];
}

export interface GetAttendanceReportInput extends PagedAndSortedResultRequestDto {
  date?: string;
  courseId?: string;
  studentId?: string;
  search?: string;
}

export interface GetStudentAttendanceStatusInput extends PagedAndSortedResultRequestDto {
  date?: string;
  studentCode?: string;
  courseId?: string;
  teacherId?: string;
  groupId?: string;
  search?: string;
}

export interface GroupSessionDto extends EntityDto<string> {
  groupId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  rosterMaterialisedAt?: string;
  addedCount: number;
  removedCount: number;
  totalCount: number;
}

export interface MyTodaySessionDto {
  groupSessionId?: string;
  attendanceId?: string;
  groupId?: string;
  groupName?: string;
  courseId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status?: AttendanceStatus;
  isSelfReported: boolean;
  canSelfCheckIn: boolean;
}

export interface ScanAttendanceQrInput {
  groupSessionId: string;
  code: string;
}

export interface SelfCheckInInput {
  groupSessionId: string;
}

export interface SetAttendanceStatusInput {
  attendanceId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface StartSessionInput {
  groupId: string;
  date: string;
}

export interface StudentAttendanceReportDto extends ExtensibleEntityDto<string> {
  studentId?: string;
  studentCode?: string;
  studentNameAr?: string;
  studentNameEn?: string;
  displayName?: string;
  photoUrl?: string;
  courseId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  courseCode?: string;
  totalDaysInMonth: number;
  attendedDays: number;
  absentDays: number;
  excusedDays: number;
  notYetDays: number;
  attendancePercentage: number;
}

export interface StudentAttendanceStatusDto {
  studentId?: string;
  studentCode?: string;
  teacherStudentCode?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  photoUrl?: string;
  enrollmentId?: string;
  groupId?: string;
  attendanceId?: string;
  groupSessionId?: string;
  date?: string;
  status?: AttendanceStatus;
  isSelfReported: boolean;
  note?: string;
}
