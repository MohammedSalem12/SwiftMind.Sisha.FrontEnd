import type { CreationAuditedEntityDto, ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateSecretaryTeacherDto {
  secretaryUserId?: string;
  teacherId?: string;
}

export interface CreateUpdateTeacherDto {
  firstName: string;
  lastName: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface SecretaryTeacherDto extends CreationAuditedEntityDto<string> {
  secretaryUserId?: string;
  teacherId?: string;
  teacherName?: string;
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
  email?: string;
  phoneNumber?: string;
  teacherCode?: string;
}

export interface TeacherEnrollmentResultDto {
  success: boolean;
  message?: string;
  enrolledCourses: string[];
  alreadyEnrolledCourses: string[];
  failedCourses: string[];
}
