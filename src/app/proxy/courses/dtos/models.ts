import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CourseDto extends ExtensibleAuditedEntityDto<string> {
  nameAr: string;
  nameEn: string;
  code: string;
  gradeId?: string;
  gradeName: string;
}

export interface CreateUpdateCourseDto {
  nameAr: string;
  nameEn: string;
  gradeId: string;
}
