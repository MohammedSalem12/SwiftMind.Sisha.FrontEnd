import type { ChildSubscriptionPaymentMethod } from './child-subscription-payment-method.enum';
import type { EntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { ParentChildSubscriptionStatus } from './parent-child-subscription-status.enum';
import type { ParentStudentLinkStatus } from '../enums/parent-student-link-status.enum';

export interface ChildCourseDto {
  courseId?: string;
  teacherId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  teacherName?: string;
  latestGradePercentage?: number;
  absentDaysInCourse: number;
}

export interface ChildSubscriptionPaymentInfoDto {
  instaPayAddress?: string;
  vodafoneCashNumber?: string;
}

export interface ChildSubscriptionPricingDto {
  durationMonths: number;
  amountEGP: number;
  pricePerMonth: number;
}

export interface ChildSummaryDto {
  studentId?: string;
  studentName?: string;
  studentPhotoUrl?: string;
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

export interface CreateParentChildSubscriptionDto {
  studentId: string;
  durationMonths: number;
  paymentMethod?: ChildSubscriptionPaymentMethod;
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

export interface LinkCandidateStudentDto {
  id?: string;
  studentCode?: string;
  fullName?: string;
  photoUrl?: string;
  currentGrade: number;
  gradeName?: string;
  address?: string;
  government?: string;
  town?: string;
  alreadyLinked: boolean;
}

export interface ParentChildLinkStatusDto {
  freeQuota: number;
  linkedChildrenCount: number;
  pricePerChildPerMonthEGP: number;
  nextChildRequiresPayment: boolean;
}

export interface ParentChildPaidLinkSettingsDto {
  enabled: boolean;
  freeQuota: number;
  pricePerChildPerMonthEGP: number;
}

export interface ParentChildSubscriptionDto extends FullAuditedEntityDto<string> {
  parentId?: string;
  parentName?: string;
  parentCode?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  durationMonths: number;
  amountEGP: number;
  status?: ParentChildSubscriptionStatus;
  isPaid: boolean;
  startDate?: string;
  endDate?: string;
  rejectionReason?: string;
  paymentMethod?: ChildSubscriptionPaymentMethod;
  paymentReference?: string;
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
  referralCode?: string;
  fullName?: string;
  photoUrl?: string;
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
  studentPhotoUrl?: string;
  gradeName?: string;
  parentName?: string;
  parentCode?: string;
  initiatedByStudent: boolean;
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

export interface SendMessageToTeacherDto {
  studentId: string;
  teacherId: string;
  subject: string;
  message: string;
}

export interface SubmitAbsenceExcuseDto {
  studentId: string;
  date: string;
  reason: string;
  notes?: string;
}

export interface UpdateParentChildPaidLinkSettingsDto {
  enabled: boolean;
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

export interface UpdateParentProfileDto {
  photoUrl?: string;
}

export interface UpdateParentStudentDto {
  relationshipType: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
}
