import { mapEnumToOptions } from '@abp/ng.core';

export enum EnrollmentRequestInitiator {
  Student = 0,
  Parent = 1,
  Teacher = 2,
}

export const enrollmentRequestInitiatorOptions = mapEnumToOptions(EnrollmentRequestInitiator);
