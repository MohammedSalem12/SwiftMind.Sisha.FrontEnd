import type { ExtensibleAuditedEntityDto, ExtensibleEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateSecretaryDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  department?: string;
  notes?: string;
}

export interface SecretaryDto extends ExtensibleAuditedEntityDto<string> {
  userId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  department?: string;
  notes?: string;
  secretaryCode?: string;
  fullName?: string;
  isActive: boolean;
  hireDate?: string;
  jobTitle?: string;
}

export interface GetSecretariesInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  keyword?: string;
  secretaryCode?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  isActive?: boolean;
}

export interface SecretaryDashboardDto {
  secretary: SecretaryDto;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalParents: number;
  pendingEnrollments: number;
  activeStudents: number;
  recentActivities: RecentActivityDto[];
  upcomingEvents: UpcomingEventDto[];
}

export interface RecentActivityDto {
  id?: string;
  activityType?: string;
  description?: string;
  timestamp?: string;
  userId?: string;
  userName?: string;
}

export interface UpcomingEventDto {
  id?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  eventType?: string;
}

export interface TeacherSecretaryDelegationDto extends ExtensibleEntityDto<string> {
  teacherId?: string;
  secretaryId?: string;
  delegationType?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  teacherName?: string;
  secretaryName?: string;
}

export interface GetTeacherSecretaryDelegationsInput extends PagedAndSortedResultRequestDto {
  teacherId?: string;
  secretaryId?: string;
  delegationType?: string;
  keyword?: string;
  isActive?: boolean;
}