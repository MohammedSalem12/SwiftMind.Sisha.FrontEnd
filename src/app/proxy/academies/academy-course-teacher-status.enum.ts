import { mapEnumToOptions } from '@abp/ng.core';

export enum AcademyCourseTeacherStatus {
  Assigned = 0,
  Requested = 1,
  Approved = 2,
  Rejected = 3,
}

export const academyCourseTeacherStatusOptions = mapEnumToOptions(AcademyCourseTeacherStatus);
