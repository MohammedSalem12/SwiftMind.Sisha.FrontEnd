import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateStudentDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  teacherStudentCode?: string;
}

export interface StudentAcademicRecordDto {
  student: StudentDto;
  courseGrades: StudentCourseGradeDto[];
  overallGPA: number;
  totalCourses: number;
  totalExams: number;
  overallAttendanceRate: number;
}

export interface StudentAttendanceDetailDto {
  date?: string;
  isPresent: boolean;
  notes?: string;
}

export interface StudentAttendanceReportDto {
  student: StudentDto;
  startDate?: string;
  endDate?: string;
  courseAttendance: StudentCourseAttendanceDto[];
  overallAttendanceRate: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
}

export interface StudentCourseAttendanceDto {
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  attendanceRecords: StudentAttendanceDetailDto[];
}

export interface StudentCourseGradeDto {
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  grades: StudentGradeDetailDto[];
  courseAverage: number;
  totalExams: number;
  letterGrade?: string;
}

export interface StudentDashboardDto {
  student: StudentDto;
  totalCourses: number;
  currentGPA: number;
  attendanceRate: number;
  recentGrades: StudentRecentGradeDto[];
  upcomingExams: StudentUpcomingExamDto[];
  recentNotifications: StudentNotificationDto[];
  totalExams: number;
  presentDays: number;
  totalAttendanceDays: number;
}

export interface StudentDto extends ExtensibleAuditedEntityDto<string> {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address?: string;
  currentGrade: number;
  schoolName?: string;
  studentCode?: string;
  teacherStudentCode?: string;
}

export interface StudentGradeDetailDto {
  examId?: string;
  grade: number;
  maxGrade: number;
  date?: string;
  percentage: number;
}

export interface StudentNotificationDto {
  id?: string;
  title?: string;
  content?: string;
  createdDate?: string;
  isRead: boolean;
  priority?: string;
}

export interface StudentRecentGradeDto {
  examId?: string;
  examName?: string;
  grade: number;
  maxGrade: number;
  date?: string;
  percentage: number;
}

export interface StudentScheduleDto {
  student: StudentDto;
  scheduleItems: StudentScheduleItemDto[];
}

export interface StudentScheduleItemDto {
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  dayOfWeek: number;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  teacherName?: string;
  dayName?: string;
}

export interface StudentUpcomingExamDto {
  examId?: string;
  examName?: string;
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  examDate?: string;
  description?: string;
  daysUntilExam: number;
}
