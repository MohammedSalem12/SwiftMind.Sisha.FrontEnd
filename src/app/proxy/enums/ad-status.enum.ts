import { mapEnumToOptions } from '@abp/ng.core';

export enum AdStatus {
  Draft = 0,
  PendingReview = 1,
  Approved = 2,
  Rejected = 3,
  Expired = 4,
  Disabled = 5,
}

export const adStatusOptions = mapEnumToOptions(AdStatus);
