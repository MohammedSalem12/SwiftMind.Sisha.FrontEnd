import { mapEnumToOptions } from '@abp/ng.core';

export enum AttendanceStatus {
  NotYet = 0,
  Present = 1,
  Absent = 2,
  Excused = 3,
}

export const attendanceStatusOptions = mapEnumToOptions(AttendanceStatus);
