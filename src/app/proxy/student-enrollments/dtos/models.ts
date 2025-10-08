import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateEnrollmentDto {
  studentId: string;
  courseId: string;
  teacherId: string;
  enrolledAt: string;
}

export interface EnrollmentDto extends ExtensibleAuditedEntityDto<string> {
  studentId?: string;
  courseId?: string;
  teacherId?: string;
  enrolledAt?: string;
}
