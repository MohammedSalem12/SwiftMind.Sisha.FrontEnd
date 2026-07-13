import { mapEnumToOptions } from '@abp/ng.core';

export enum PromotionPaymentMethod {
  InstaPay = 0,
  VodafoneCash = 1,
}

export const promotionPaymentMethodOptions = mapEnumToOptions(PromotionPaymentMethod);
