import { mapEnumToOptions } from '@abp/ng.core';

export enum AcademyTeacherStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export const academyTeacherStatusOptions = mapEnumToOptions(AcademyTeacherStatus);
