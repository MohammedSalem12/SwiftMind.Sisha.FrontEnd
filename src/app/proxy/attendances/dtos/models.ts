import type { ExtensibleAuditedEntityDto, ExtensibleEntityDto, PagedAndSortedResultRequestDto, PagedResultDto } from '@abp/ng.core';

export interface AttendanceDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  date?: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}

export interface AttendanceReportResultDto extends PagedResultDto<StudentAttendanceReportDto> {
}

export interface CreateUpdateAttendanceDto {
  enrollmentId: string;
  date: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}

export interface GetAttendanceReportInput extends PagedAndSortedResultRequestDto {
  date?: string;
  courseId?: string;
  studentId?: string;
  search?: string;
}

export interface StudentAttendanceReportDto extends ExtensibleEntityDto<string> {
  studentId?: string;
  studentCode?: string;
  studentNameAr?: string;
  studentNameEn?: string;
  displayName?: string;
  courseId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  courseCode?: string;
  totalDaysInMonth: number;
  attendedDays: number;
  absentDays: number;
  attendancePercentage: number;
}
