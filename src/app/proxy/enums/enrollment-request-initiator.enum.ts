import { mapEnumToOptions } from '@abp/ng.core';

export enum EnrollmentRequestInitiator {
  Student = 0,
  Parent = 1,
}

export const enrollmentRequestInitiatorOptions = mapEnumToOptions(EnrollmentRequestInitiator);
