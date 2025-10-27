import type { EntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';
import type { StudentDto } from '../students/models';

export interface CreateParentDto {
  userId?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  occupation?: string;
  emergencyContact?: string;
  parentCode?: string;
}

export interface CreateParentStudentDto {
  parentId?: string;
  studentId?: string;
  relationshipType: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
}

export interface GetParentsInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  parentCode?: string;
  email?: string;
  phoneNumber?: string;
  studentId?: string;
}

export interface MonthlyAttendanceDto {
  year: number;
  month: number;
  totalDays: number;
  presentDays: number;
  attendanceRate: number;
  monthName?: string;
}

export interface MonthlyGradeDto {
  year: number;
  month: number;
  averageGrade: number;
  examCount: number;
  monthName?: string;
}

export interface NotificationDto {
  id?: string;
  title?: string;
  content?: string;
  createdDate?: string;
  isRead: boolean;
}

export interface ParentDashboardDto {
  parent: ParentDto;
  students: StudentProgressDto[];
  totalChildren: number;
  overallAttendanceRate: number;
  recentNotifications: NotificationDto[];
  upcomingExams: UpcomingExamDto[];
}

export interface ParentDto extends FullAuditedEntityDto<string> {
  userId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  occupation?: string;
  emergencyContact?: string;
  parentCode?: string;
  fullName?: string;
  parentStudents: ParentStudentDto[];
}

export interface ParentLookupDto extends EntityDto<string> {
  fullName?: string;
  parentCode?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ParentRegistrationResultDto {
  parent: ParentDto;
  userId?: string;
  userName?: string;
  email?: string;
  emailConfirmed: boolean;
  parentCode?: string;
}

export interface ParentStudentDto extends FullAuditedEntityDto {
  parentId?: string;
  studentId?: string;
  relationshipType?: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
  parent: ParentDto;
  studentName?: string;
  studentCode?: string;
}

export interface RecentGradeDto {
  examId?: string;
  examName?: string;
  grade: number;
  maxGrade: number;
  date?: string;
  percentage: number;
}

export interface RegisterParentDto {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
}

export interface StudentComparisonDto {
  studentId?: string;
  studentName?: string;
  averageGrade: number;
  attendanceRate: number;
  totalCourses: number;
  completedExams: number;
  performanceLevel?: string;
}

export interface StudentDetailedReportDto {
  student: StudentDto;
  enrolledCourses: number;
  totalExams: number;
  averageGrade: number;
  highestGrade: number;
  lowestGrade: number;
  totalAttendanceDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  gradesByMonth: MonthlyGradeDto[];
  attendanceByMonth: MonthlyAttendanceDto[];
}

export interface StudentProgressDto {
  student: StudentDto;
  averageGrade: number;
  attendanceRate: number;
  recentGrades: RecentGradeDto[];
  upcomingExams: UpcomingExamDto[];
  totalCourses: number;
  completedExams: number;
  totalAttendanceDays: number;
  presentDays: number;
}

export interface UpcomingExamDto {
  examId?: string;
  examName?: string;
  courseName?: string;
  examDate?: string;
  studentIds: string[];
  daysUntilExam: number;
}

export interface UpdateParentDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  phoneNumber: string;
  email: string;
  occupation?: string;
  emergencyContact?: string;
}

export interface UpdateParentStudentDto {
  relationshipType: string;
  isEmergencyContact: boolean;
  canPickUp: boolean;
  notes?: string;
}
