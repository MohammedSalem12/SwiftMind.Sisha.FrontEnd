import { mapEnumToOptions } from '@abp/ng.core';

export enum ParentStudentLinkStatus {
  Pending = 0,
  Confirmed = 1,
  Rejected = 2,
}

export const parentStudentLinkStatusOptions = mapEnumToOptions(ParentStudentLinkStatus);
