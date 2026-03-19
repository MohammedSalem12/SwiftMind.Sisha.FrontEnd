import { mapEnumToOptions } from '@abp/ng.core';

export enum AcademyCourseTeacherAssignedByType {
  Supervisor = 0,
  TeacherRequest = 1,
}

export const academyCourseTeacherAssignedByTypeOptions = mapEnumToOptions(AcademyCourseTeacherAssignedByType);
