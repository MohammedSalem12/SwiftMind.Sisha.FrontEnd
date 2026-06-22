import type { GroupType } from './group-type.enum';
import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CancelSessionDto {
  groupScheduleId: string;
  reason?: string;
}

export interface CreateUpdateGroupDto {
  name: string;
  teacherId: string;
  courseId?: string;
  groupType?: GroupType;
  meetingLink?: string;
  location?: string;
}

export interface GroupDto extends ExtensibleAuditedEntityDto<string> {
  name?: string;
  teacherId?: string;
  teacherName?: string;
  groupCode?: string;
  courseId?: string;
  courseName?: string;
  groupType?: GroupType;
  meetingLink?: string;
  location?: string;
  isStopped: boolean;
  autoAcceptJoinRequests: boolean;
}
