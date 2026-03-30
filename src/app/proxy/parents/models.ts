import type { EntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { ParentStudentLinkStatus } from '../enums/parent-student-link-status.enum';

export interface ChildCourseDto {
  courseId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  teacherName?: string;
  latestGradePercentage?: number;
  absentDaysInCourse: number;
}

export interface ChildSummaryDto {
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  currentGrade: number;
  gradeName?: string;
  attendedDays: number;
  absentDays: number;
  totalSchoolDays: number;
  attendancePercentage: number;
  totalCourses: number;
  courses: ChildCourseDto[];
  recentActivities: RecentActivityDto[];
}

export interface CreateParentDto {
  userId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  occupation?: string;
  emergencyContact?: string;
  parentCode?: string;
}

export interface CreateParentStudentDto {
  parentId?: string;
  studentId?: string;
  relationshipType: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
}

export interface GetParentsInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  parentCode?: string;
  email?: string;
  phoneNumber?: string;
  studentId?: string;
}

export interface ParentDashboardDto {
  parentName?: string;
  totalChildren: number;
  children: ChildSummaryDto[];
}

export interface ParentDto extends FullAuditedEntityDto<string> {
  userId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  occupation?: string;
  emergencyContact?: string;
  parentCode?: string;
  fullName?: string;
  parentStudents: ParentStudentDto[];
}

export interface ParentLookupDto extends EntityDto<string> {
  fullName?: string;
  parentCode?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ParentRegistrationResultDto {
  parent: ParentDto;
  userId?: string;
  userName?: string;
  email?: string;
  emailConfirmed: boolean;
  parentCode?: string;
}

export interface ParentStudentDto extends FullAuditedEntityDto {
  parentId?: string;
  studentId?: string;
  relationshipType?: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
  parent: ParentDto;
  studentName?: string;
  studentCode?: string;
  gradeName?: string;
  linkStatus?: ParentStudentLinkStatus;
}

export interface RecentActivityDto {
  type?: string;
  messageAr?: string;
  messageEn?: string;
  date?: string;
}

export interface RegisterParentDto {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
}

export interface UpdateParentDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  occupation?: string;
  emergencyContact?: string;
}

export interface UpdateParentStudentDto {
  relationshipType: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
}
