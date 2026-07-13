import { mapEnumToOptions } from '@abp/ng.core';

export enum EnrollmentSubscriptionPlan {
  Monthly = 0,
  Yearly = 1,
}

export const enrollmentSubscriptionPlanOptions = mapEnumToOptions(EnrollmentSubscriptionPlan);
