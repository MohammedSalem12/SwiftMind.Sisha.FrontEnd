import { mapEnumToOptions } from '@abp/ng.core';

export enum StudentEnrollmentSubscriptionStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Expired = 3,
}

export const studentEnrollmentSubscriptionStatusOptions = mapEnumToOptions(StudentEnrollmentSubscriptionStatus);
