import type { EntityDto, FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

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

// Dashboard DTOs
export interface ParentDashboardDto {
  parent: ParentDto;
  students: StudentProgressDto[];
  totalChildren: number;
  averageGPA: number;
  overallAttendanceRate: number;
  recentNotifications: NotificationDto[];
  upcomingExams: UpcomingExamDto[];
}

export interface StudentProgressDto {
  student: any; // StudentDto from students module
  averageGrade: number;
  attendanceRate: number;
  recentGrades: RecentGradeDto[];
  upcomingExams: UpcomingExamDto[];
  totalCourses: number;
  completedExams: number;
  totalAttendanceDays: number;
  presentDays: number;
}

export interface RecentGradeDto {
  id: string;
  examId: string;
  examName: string;
  courseName: string;
  grade: number;
  maxGrade: number;
  date: string;
  percentage: number;
}

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  content: string;
  type: string;
  createdAt: string;
  createdDate: string;
  isRead: boolean;
}

export interface UpcomingExamDto {
  id: string;
  examId: string;
  examName: string;
  courseName: string;
  studentName: string;
  examDate: string;
  studentIds: string[];
  daysUntilExam: number;
}

export interface StudentDetailedReportDto {
  student: any; // StudentDto from students module
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

export interface MonthlyGradeDto {
  year: number;
  month: number;
  averageGrade: number;
  examCount: number;
  monthName: string;
}

export interface MonthlyAttendanceDto {
  year: number;
  month: number;
  totalDays: number;
  presentDays: number;
  attendanceRate: number;
  monthName: string;
}

export interface StudentComparisonDto {
  studentId: string;
  studentName: string;
  className: string;
  currentGPA: number;
  averageGrade: number;
  attendanceRate: number;
  totalCourses: number;
  completedExams: number;
  performanceLevel: string;
  performanceStatus: string;
  recentGrades: RecentGradeDto[];
}
