import { mapEnumToOptions } from '@abp/ng.core';

export enum PromotionRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const promotionRequestStatusOptions = mapEnumToOptions(PromotionRequestStatus);
