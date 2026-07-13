import type { EnrollmentSubscriptionPlan } from './enrollment-subscription-plan.enum';
import type { EnrollmentSubscriptionPaymentMethod } from './enrollment-subscription-payment-method.enum';
import type { ExtensibleAuditedEntityDto, FullAuditedEntityDto } from '@abp/ng.core';
import type { GroupChangeRequestStatus } from './group-change-request-status.enum';
import type { PromotionRequestStatus } from './promotion-request-status.enum';
import type { StudentEnrollmentSubscriptionStatus } from './student-enrollment-subscription-status.enum';

export interface CreateEnrollmentSubscriptionDto {
  plan: EnrollmentSubscriptionPlan;
  paymentMethod: EnrollmentSubscriptionPaymentMethod;
}

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

export interface EnrollmentQuotaStatusDto {
  freeCourseQuota: number;
  enrolledCourseCount: number;
  canEnrollFree: boolean;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: string;
  hasPendingSubscription: boolean;
  pendingPaymentReference?: string;
  monthlyPriceEGP: number;
  yearlyPriceEGP: number;
}

export interface GroupChangeRequestDto extends FullAuditedEntityDto<string> {
  studentId?: string;
  studentName?: string;
  studentPhotoUrl?: string;
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
  studentPhotoUrl?: string;
  studentCode?: string;
  fromGrade: number;
  toGrade: number;
  fromGradeName?: string;
  toGradeName?: string;
  status?: PromotionRequestStatus;
  initiatorType?: string;
}

export interface RejectEnrollmentSubscriptionDto {
  reason?: string;
}

export interface RequestParentLinkDto {
  parentCode: string;
  relationshipType?: string;
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
  photoUrl?: string;
  statusMessage?: string;
}

export interface StudentEnrollmentSubscriptionDto {
  id?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  plan?: EnrollmentSubscriptionPlan;
  durationMonths: number;
  amountEGP: number;
  status?: StudentEnrollmentSubscriptionStatus;
  isPaid: boolean;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string;
  paymentMethod?: EnrollmentSubscriptionPaymentMethod;
  paymentReference?: string;
  isCurrentlyActive: boolean;
}

export interface UpdateStudentProfileDto {
  photoUrl?: string;
  statusMessage?: string;
}
