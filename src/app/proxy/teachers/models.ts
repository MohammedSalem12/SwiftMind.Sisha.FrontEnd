import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateTeacherDto {
  firstName: string;
  lastName: string;
  address?: string;
}

export interface TeacherDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  lastName?: string;
  address?: string;
}
