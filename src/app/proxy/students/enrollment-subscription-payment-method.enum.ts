import { mapEnumToOptions } from '@abp/ng.core';

export enum EnrollmentSubscriptionPaymentMethod {
  InstaPay = 0,
  VodafoneCash = 1,
}

export const enrollmentSubscriptionPaymentMethodOptions = mapEnumToOptions(EnrollmentSubscriptionPaymentMethod);
