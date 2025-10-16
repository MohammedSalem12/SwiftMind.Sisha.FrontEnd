import { mapEnumToOptions } from '@abp/ng.core';

export enum UserRegistrationType {
  Parent = 1,
  Student = 2,
  Teacher = 3,
  Secretary = 4,
}

export const userRegistrationTypeOptions = mapEnumToOptions(UserRegistrationType);
