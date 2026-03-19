import { mapEnumToOptions } from '@abp/ng.core';

export enum PasswordResetRequestStatus {
  Pending = 0,
  Resolved = 1,
  Rejected = 2,
}

export const passwordResetRequestStatusOptions = mapEnumToOptions(PasswordResetRequestStatus);
