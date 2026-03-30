import { mapEnumToOptions } from '@abp/ng.core';

export enum RegistrationRequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const registrationRequestStatusOptions = mapEnumToOptions(RegistrationRequestStatus);
