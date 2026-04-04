import type { GroupType } from '../group-type.enum';
import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface EditGroupDto {
  name?: string;
  description?: string;
  groupType?: GroupType;
  meetingLink?: string;
  location?: string;
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
  gradeName?: string;
  groupType?: GroupType;
  meetingLink?: string;
  location?: string;
  schedules: GroupScheduleDto[];
}

export interface NextSessionDto {
  groupId?: string;
  groupScheduleId?: string;
  courseId?: string;
  courseName?: string;
  groupName?: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  nextOccurrence?: string;
  secondsUntilStart: number;
  isNow: boolean;
}

export interface SendSessionMessageDto {
  message: string;
}

export interface SessionMessageDto {
  id?: string;
  groupScheduleId?: string;
  groupId?: string;
  senderName?: string;
  message?: string;
  creationTime?: string;
}
