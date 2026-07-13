import { mapEnumToOptions } from '@abp/ng.core';

export enum ChildSubscriptionPaymentMethod {
  InstaPay = 0,
  VodafoneCash = 1,
}

export const childSubscriptionPaymentMethodOptions = mapEnumToOptions(ChildSubscriptionPaymentMethod);
