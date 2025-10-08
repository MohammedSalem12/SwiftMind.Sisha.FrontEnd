import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateExamGradeDto {
  enrollmentId: string;
  examName: string;
  date: string;
  grade: number;
  maxGrade: number;
}

export interface ExamGradeDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  examName?: string;
  date?: string;
  grade: number;
  maxGrade: number;
}
