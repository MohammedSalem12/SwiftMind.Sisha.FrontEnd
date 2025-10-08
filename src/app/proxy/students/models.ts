import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateStudentDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  teacherStudentCode?: string;
}

export interface StudentDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  studentCode?: string;
  teacherStudentCode?: string;
}
