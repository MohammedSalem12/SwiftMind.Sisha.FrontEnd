import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface EditGroupDto {
  name?: string;
  description?: string;
}

export interface EditGroupScheduleDto {
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
}

export interface GroupScheduleDto extends ExtensibleAuditedEntityDto<string> {
  groupId?: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  location?: string;
}

export interface GroupWithSchedulesDto {
  groupId?: string;
  name?: string;
  teacherId?: string;
  teacherName?: string;
  groupCode?: string;
  courseId?: string;
  courseName?: string;
  schedules: GroupScheduleDto[];
}
