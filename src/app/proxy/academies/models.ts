import type { FullAuditedEntityDto } from '@abp/ng.core';
import type { AcademyTeacherStatus } from './academy-teacher-status.enum';

export interface AcademyDto extends FullAuditedEntityDto<string> {
  nameAr?: string;
  nameEn?: string;
  code?: string;
  description?: string;
  supervisorTeacherId?: string;
  supervisorName?: string;
  isActive: boolean;
  memberCount: number;
  courseCount: number;
}

export interface AcademyMemberDto {
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  status?: AcademyTeacherStatus;
}

export interface CreateAcademyDto {
  nameAr: string;
  nameEn: string;
  description?: string;
  supervisorTeacherCode?: string;
}
