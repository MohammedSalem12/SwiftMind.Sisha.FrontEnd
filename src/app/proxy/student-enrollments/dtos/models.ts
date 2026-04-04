import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateEnrollmentDto {
  studentId: string;
  courseId: string;
  teacherId: string;
  groupId?: string;
  enrolledAt: string;
}

export interface EnrolledStudentDto {
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  enrolledAt?: string;
  currentGrade: number;
  gradeName?: string;
  parentName?: string;
  absentDays: number;
  totalDays: number;
  attendancePercentage: number;
}

export interface EnrollmentDto extends ExtensibleAuditedEntityDto<string> {
  studentId?: string;
  courseId?: string;
  teacherId?: string;
  groupId?: string;
  enrolledAt?: string;
  academicTermId?: string;
  academicTermName?: string;
}
