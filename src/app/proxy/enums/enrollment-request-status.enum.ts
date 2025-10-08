import { mapEnumToOptions } from '@abp/ng.core';

export enum EnrollmentRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const enrollmentRequestStatusOptions = mapEnumToOptions(EnrollmentRequestStatus);
