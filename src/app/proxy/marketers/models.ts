import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateMarketerDto {
  firstName: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  company?: string;
  feePerTeacher: number;
}

export interface MarketerAddScheduleDto {
  groupId: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface MarketerCreateCourseDto {
  teacherId: string;
  nameAr: string;
  nameEn: string;
  gradeId?: string;
}

export interface MarketerCreateGroupDto {
  teacherId: string;
  courseId: string;
  name: string;
  groupType: number;
  meetingLink?: string;
  location?: string;
}

export interface MarketerDto extends FullAuditedEntityDto<string> {
  userId?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  company?: string;
  marketerCode?: string;
  referralCode?: string;
  feePerTeacher: number;
  fullName?: string;
}

export interface MarketerRegisterSecretaryDto {
  teacherId: string;
  userName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface MarketerRegistrationResultDto {
  marketer: MarketerDto;
  userId?: string;
  userName?: string;
  email?: string;
  marketerCode?: string;
}

export interface MarketerStatsDto {
  marketerId?: string;
  fullName?: string;
  marketerCode?: string;
  teacherCount: number;
  feePerTeacher: number;
  amountOwed: number;
}

export interface MarketerTeacherDto {
  id?: string;
  fullName?: string;
  teacherCode?: string;
  email?: string;
  phoneNumber?: string;
  creationTime?: string;
}

export interface OnboardTeacherDto {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
}

export interface RegisterMarketerDto {
  userName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  company?: string;
  feePerTeacher: number;
}

export interface SetMarketerFeeDto {
  marketerId: string;
  feePerTeacher: number;
}
