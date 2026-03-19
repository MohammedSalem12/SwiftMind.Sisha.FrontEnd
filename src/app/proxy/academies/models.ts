import type { AcademyCourseTeacherStatus } from './academy-course-teacher-status.enum';
import type { AcademyCourseTeacherAssignedByType } from './academy-course-teacher-assigned-by-type.enum';
import type { FullAuditedEntityDto } from '@abp/ng.core';
import type { AcademyTeacherStatus } from './academy-teacher-status.enum';

export interface AcademyCourseDto {
  courseId?: string;
  academyId?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  courseCode?: string;
  gradeName?: string;
  isActive: boolean;
}

export interface AcademyCourseTeacherDto {
  academyId?: string;
  courseId?: string;
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  courseNameAr?: string;
  courseNameEn?: string;
  courseCode?: string;
  status?: AcademyCourseTeacherStatus;
  assignedByType?: AcademyCourseTeacherAssignedByType;
}

export interface AcademyDto extends FullAuditedEntityDto<string> {
  nameAr?: string;
  nameEn?: string;
  description?: string;
  code?: string;
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
  nameAr?: string;
  nameEn?: string;
  description?: string;
  supervisorTeacherCode?: string;
}

export interface UpdateAcademyDto {
  nameAr: string;
  nameEn: string;
  description?: string;
}
