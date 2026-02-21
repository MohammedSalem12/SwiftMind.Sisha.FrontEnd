import { mapEnumToOptions } from '@abp/ng.core';

export enum NotificationType {
  EnrollmentApproved = 0,
  EnrollmentRejected = 1,
  EnrollmentRequestPending = 2,
  ParentStudentLinked = 3,
  General = 4,
}

export const notificationTypeOptions = mapEnumToOptions(NotificationType);
