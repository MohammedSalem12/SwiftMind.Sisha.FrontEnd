import { mapEnumToOptions } from '@abp/ng.core';

export enum PointTransactionType {
  Registration = 0,
  Referral = 1,
  ReferralBonus = 2,
  CourseEnrollment = 3,
  AttendanceStreak = 4,
  ExamGradeBonus = 5,
  Redemption = 10,
}

export const pointTransactionTypeOptions = mapEnumToOptions(PointTransactionType);
