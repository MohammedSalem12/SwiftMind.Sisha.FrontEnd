import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface AttendanceDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  date?: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}

export interface CreateUpdateAttendanceDto {
  enrollmentId: string;
  date: string;
  isAbsent: boolean;
  note?: string;
  gradeId?: string;
}
