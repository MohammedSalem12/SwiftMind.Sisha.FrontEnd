import { mapEnumToOptions } from '@abp/ng.core';

export enum GroupChangeRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const groupChangeRequestStatusOptions = mapEnumToOptions(GroupChangeRequestStatus);
