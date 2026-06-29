import type { PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface AdminRelatedUserDto {
  name?: string;
  code?: string;
}

export interface AdminUserCourseDto {
  courseName?: string;
  teacherName?: string;
}

export interface AdminUserDto {
  userId?: string;
  userName?: string;
  name?: string;
  email?: string;
  roles: string[];
  actorType?: string;
  code?: string;
  grade?: number;
  parents: AdminRelatedUserDto[];
  children: AdminRelatedUserDto[];
  secretaries: AdminRelatedUserDto[];
  teachersManaged: AdminRelatedUserDto[];
  courses: AdminUserCourseDto[];
}

export interface AdminUserListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  role?: string;
}

export interface SetUserPasswordDto {
  newPassword: string;
}
