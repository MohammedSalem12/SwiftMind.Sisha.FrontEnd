import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface AttendanceDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  date?: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}

export interface  CreateUpdateAttendanceDto {
  enrollmentId: string;
  date: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}

export interface GetAttendanceReportInput extends PagedAndSortedResultRequestDto {
  date?: string;
  courseId?: string | null;
  studentId?: string | null;
  search?: string;
}

export interface StudentAttendanceReportDto extends ExtensibleEntityDto<string> {
  studentId?: string;
  studentCode?: string;
  studentNameAr?: string;
  studentNameEn?: string;
  totalDays?: number;
  presentDays?: number;
  absentDays?: number;
}

export interface AttendanceReportResultDto extends PagedResultDto<StudentAttendanceReportDto> {}

// Helper base types used above
import type { PagedResultDto, PagedAndSortedResultRequestDto, ExtensibleEntityDto } from '@abp/ng.core';
