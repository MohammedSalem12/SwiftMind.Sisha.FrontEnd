import { mapEnumToOptions } from '@abp/ng.core';

export enum NotificationType {
  EnrollmentApproved = 0,
  EnrollmentRejected = 1,
  EnrollmentRequestPending = 2,
  ParentStudentLinked = 3,
  ExamGradePosted = 4,
  AttendanceMarkedAbsent = 5,
  General = 6,
}

export const notificationTypeOptions = mapEnumToOptions(NotificationType);
