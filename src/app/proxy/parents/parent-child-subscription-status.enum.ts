import { mapEnumToOptions } from '@abp/ng.core';

export enum ParentChildSubscriptionStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Expired = 3,
}

export const parentChildSubscriptionStatusOptions = mapEnumToOptions(ParentChildSubscriptionStatus);
