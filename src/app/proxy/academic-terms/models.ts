import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface AcademicTermDto extends FullAuditedEntityDto<string> {
  nameAr?: string;
  nameEn?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  academicYear?: string;
  termNumber: number;
}

export interface CopySemesterResultDto {
  enrollmentsCopied: number;
  enrollmentsSkipped: number;
  sourceTermName?: string;
  targetTermName?: string;
}

export interface CreateUpdateAcademicTermDto {
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  termNumber: number;
}
