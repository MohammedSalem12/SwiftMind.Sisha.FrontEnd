import { AcademyTeacherStatus } from './academy-teacher-status.enum';

export interface AcademyDto {
  id?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  code?: string;
  supervisorTeacherId?: string;
  supervisorName?: string;
  isActive?: boolean;
  memberCount?: number;
  courseCount?: number;
}

export interface CreateAcademyDto {
  nameAr: string;
  nameEn: string;
  description?: string;
  supervisorTeacherCode?: string;
}

export interface AcademyMemberDto {
  teacherId?: string;
  teacherName?: string;
  teacherCode?: string;
  status?: AcademyTeacherStatus;
}
