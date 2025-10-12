import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateTeacherDto {
  firstName: string;
  lastName: string;
  address?: string;
}

export interface TeacherAutocompleteDto {
  id?: string;
  code?: string;
  nameEnglish?: string;
  nameArabic?: string;
  displayName?: string;
}

export interface TeacherDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  lastName?: string;
  address?: string;
}

export interface TeacherEnrollmentResultDto {
  success: boolean;
  message?: string;
  enrolledCourses: string[];
  alreadyEnrolledCourses: string[];
  failedCourses: string[];
}
