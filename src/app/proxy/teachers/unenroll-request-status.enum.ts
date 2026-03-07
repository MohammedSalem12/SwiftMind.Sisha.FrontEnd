import { mapEnumToOptions } from '@abp/ng.core';

export enum UnenrollRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const unenrollRequestStatusOptions = mapEnumToOptions(UnenrollRequestStatus);
