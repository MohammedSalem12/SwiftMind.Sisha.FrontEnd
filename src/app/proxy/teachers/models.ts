import type { CreationAuditedEntityDto, EntityDto, ExtensibleAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { SecretaryTeacherRequestStatus } from './secretary-teacher-request-status.enum';
import type { UnenrollRequestStatus } from './unenroll-request-status.enum';

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
  government?: string;
  town?: string;
}

export interface SecretaryInfoDto {
  secretaryUserId?: string;
  linkId?: string;
  userName?: string;
  displayName?: string;
  email?: string;
}

export interface SecretaryTeacherDto extends CreationAuditedEntityDto<string> {
  secretaryUserId?: string;
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
}

export interface SecretaryTeacherRequestDto extends CreationAuditedEntityDto<string> {
  secretaryUserId?: string;
  teacherId?: string;
  status?: SecretaryTeacherRequestStatus;
  secretaryName?: string;
  teacherName?: string;
  decidedAt?: string;
}

export interface SecretaryUserSearchResultDto {
  userId?: string;
  userName?: string;
  displayName?: string;
  email?: string;
  alreadyLinked: boolean;
}

export interface TeacherAutocompleteDto {
  id?: string;
  code?: string;
  nameEnglish?: string;
  nameArabic?: string;
  displayName?: string;
}

export interface TeacherDashboardAbsentDto {
  studentName?: string;
  studentCode?: string;
  courseName?: string;
  courseId?: string;
}

export interface TeacherDashboardDto {
  totalCourses: number;
  totalStudents: number;
  totalExams: number;
  absentTodayCount: number;
  unreadNotifications: number;
  recentAbsences: TeacherDashboardAbsentDto[];
  recentNotifications: TeacherDashboardNotificationDto[];
}

export interface TeacherDashboardNotificationDto {
  id?: string;
  title?: string;
  message?: string;
  isRead: boolean;
  createdAt?: string;
  type: number;
}

export interface TeacherDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  lastName?: string;
  address?: string;
  email?: string;
  phoneNumber?: string;
  teacherCode?: string;
  government?: string;
  town?: string;
}

export interface TeacherEnrolledCourseDto {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  gradeName?: string;
  isEnrolled: boolean;
  pendingUnenrollStatus?: UnenrollRequestStatus;
  unenrollRequestId?: string;
}

export interface TeacherEnrollmentResultDto {
  success: boolean;
  message?: string;
  enrolledCourses: string[];
  alreadyEnrolledCourses: string[];
  failedCourses: string[];
}

export interface TeacherFilterDto extends PagedAndSortedResultRequestDto {
  government?: string;
  town?: string;
  nameOrCode?: string;
}

export interface TeacherUnenrollRequestDto extends EntityDto<string> {
  teacherId?: string;
  teacherName?: string;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  status?: UnenrollRequestStatus;
  rejectionReason?: string;
  processedAt?: string;
  creationTime?: string;
}
