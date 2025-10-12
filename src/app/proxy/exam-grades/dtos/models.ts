import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateExamGradeDto {
  enrollmentId: string;
  examId: string;
  date: string;
  grade: number;
  maxGrade: number;
}

export interface EnrollmentInfoDto {
  id?: string;
  studentName?: string;
  courseName?: string;
  enrolledAt?: string;
}

export interface ExamGradeDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  examId?: string;
  date?: string;
  grade: number;
  maxGrade: number;
  examName?: string;
  examCode?: string;
  studentName?: string;
  courseName?: string;
}

export interface ExamGradeWithDetailsDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  examId?: string;
  date?: string;
  grade: number;
  maxGrade: number;
  percentage: number;
  exam: ExamInfoDto;
  enrollment: EnrollmentInfoDto;
}

export interface ExamInfoDto {
  id?: string;
  examName?: string;
  examCode?: string;
  examDescription?: string;
  courseName?: string;
  teacherName?: string;
  groupName?: string;
}
