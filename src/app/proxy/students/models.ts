import type { ExtensibleAuditedEntityDto, FullAuditedEntityDto } from '@abp/ng.core';
import type { GroupChangeRequestStatus } from './group-change-request-status.enum';
import type { PromotionRequestStatus } from './promotion-request-status.enum';

export interface CreateGroupChangeRequestDto {
  studentId?: string;
  courseId?: string;
  enrollmentId?: string;
  toGroupId?: string;
  reason?: string;
}

export interface CreatePromotionRequestDto {
  studentId?: string;
}

export interface CreateUpdateStudentDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  teacherStudentCode?: string;
  government?: string;
  town?: string;
}

export interface GroupChangeRequestDto extends FullAuditedEntityDto<string> {
  studentId?: string;
  studentName?: string;
  courseId?: string;
  courseName?: string;
  fromGroupId?: string;
  fromGroupName?: string;
  toGroupId?: string;
  toGroupName?: string;
  toTeacherId?: string;
  toTeacherName?: string;
  status?: GroupChangeRequestStatus;
  reason?: string;
  initiatorType?: string;
  rejectionReason?: string;
}

export interface PromotionRequestDto extends FullAuditedEntityDto<string> {
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  fromGrade: number;
  toGrade: number;
  fromGradeName?: string;
  toGradeName?: string;
  status?: PromotionRequestStatus;
  initiatorType?: string;
}

export interface StudentDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  studentCode?: string;
  teacherStudentCode?: string;
  government?: string;
  town?: string;
  referralCode?: string;
}
