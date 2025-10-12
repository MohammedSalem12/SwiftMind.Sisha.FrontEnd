import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CourseInfoDto {
  id?: string;
  nameEn?: string;
  nameAr?: string;
  code?: string;
}

export interface CreateUpdateExamDto {
  examName: string;
  examDescription?: string;
  courseId: string;
  teacherId: string;
  groupId?: string;
}

export interface ExamDto extends ExtensibleAuditedEntityDto<string> {
  examName?: string;
  examDescription?: string;
  courseId?: string;
  teacherId?: string;
  groupId?: string;
  examCode?: string;
  courseName?: string;
  teacherName?: string;
  groupName?: string;
}

export interface ExamWithDetailsDto extends ExamDto {
  course: CourseInfoDto;
  teacher: TeacherInfoDto;
  group: GroupInfoDto;
}

export interface GroupInfoDto {
  id?: string;
  name?: string;
  groupCode?: string;
}

export interface TeacherInfoDto {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}
