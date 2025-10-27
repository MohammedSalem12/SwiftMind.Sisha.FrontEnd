import type { EntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateSecretaryDto {
  userId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
}

export interface CreateUpdateTeacherSecretaryDelegationDto {
  teacherId: string;
  secretaryId: string;
  startDate: string;
  endDate?: string;
  canManageExams: boolean;
  canManageGrades: boolean;
  canManageAttendance: boolean;
  canManageGroups: boolean;
  canViewReports: boolean;
  notes?: string;
}

export interface DelegationPermissionUpdateDto {
  delegationId: string;
  canManageExams: boolean;
  canManageGrades: boolean;
  canManageAttendance: boolean;
  canManageGroups: boolean;
  canViewReports: boolean;
}

export interface GetSecretariesInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  department?: string;
  isActive?: boolean;
  userId?: string;
}

export interface GetTeacherSecretaryDelegationsInput extends PagedAndSortedResultRequestDto {
  teacherId?: string;
  secretaryId?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface SecretaryDashboardDto {
  secretary: SecretaryDto;
  activeDelegations: TeacherSecretaryDelegationDto[];
  totalTeachersAssisted: number;
  activeExamsManaged: number;
  gradesEntered: number;
  attendanceRecordsManaged: number;
}

export interface SecretaryDto extends EntityDto<string> {
  userId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  secretaryCode?: string;
  department?: string;
  jobTitle?: string;
  hireDate?: string;
  isActive: boolean;
  fullName?: string;
  activeDelegations: TeacherSecretaryDelegationDto[];
}

export interface SecretaryLookupDto extends EntityDto<string> {
  firstName?: string;
  lastName?: string;
  secretaryCode?: string;
  fullName?: string;
  department?: string;
  isActive: boolean;
}

export interface TeacherSecretaryDelegationDto extends EntityDto<string> {
  teacherId?: string;
  secretaryId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  canManageExams: boolean;
  canManageGrades: boolean;
  canManageAttendance: boolean;
  canManageGroups: boolean;
  canViewReports: boolean;
  notes?: string;
  teacherName?: string;
  secretaryName?: string;
  teacherCode?: string;
  secretaryCode?: string;
}
