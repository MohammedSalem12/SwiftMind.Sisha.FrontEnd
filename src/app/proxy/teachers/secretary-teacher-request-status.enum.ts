import { mapEnumToOptions } from '@abp/ng.core';

export enum SecretaryTeacherRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const secretaryTeacherRequestStatusOptions = mapEnumToOptions(SecretaryTeacherRequestStatus);
