import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateGroupDto {
  name: string;
  teacherId: string;
  courseId?: string;
}

export interface GroupDto extends ExtensibleAuditedEntityDto<string> {
  name?: string;
  teacherId?: string;
  teacherName?: string;
  groupCode?: string;
  courseId?: string;
  courseName?: string;
}
