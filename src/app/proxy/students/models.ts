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

export interface StudentDashboardDto {
  student: StudentDto;
  currentCourses: CurrentCourseDto[];
  recentGrades: RecentGradeDto[];
  upcomingExams: UpcomingExamDto[];
  attendanceStats: AttendanceStatsDto;
  announcements: AnnouncementDto[];
}

export interface StudentScheduleDto {
  student: StudentDto;
  weeklySchedule: WeeklyScheduleDto[];
  todaySchedule: TodayScheduleDto[];
}

export interface CurrentCourseDto {
  courseId?: string;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  currentGrade: number;
  attendancePercentage: number;
  nextClassDate?: string;
}

export interface RecentGradeDto {
  examId?: string;
  examName?: string;
  courseName?: string;
  courseCode?: string;
  grade: number;
  maxGrade: number;
  examDate?: string;
}

export interface UpcomingExamDto {
  examId?: string;
  examName?: string;
  courseName?: string;
  courseCode?: string;
  examDate?: string;
  examType?: string;
}

export interface AttendanceStatsDto {
  totalDays: number;
  attendedDays: number;
  absentDays: number;
  attendancePercentage: number;
  thisMonthAttendance: number;
}

export interface AnnouncementDto {
  id?: string;
  title?: string;
  content?: string;
  publishDate?: string;
  isImportant: boolean;
  authorName?: string;
}

export interface WeeklyScheduleDto {
  dayOfWeek: number;
  dayName?: string;
  classes: ClassScheduleDto[];
}

export interface TodayScheduleDto {
  classId?: string;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  isCompleted: boolean;
}

export interface ClassScheduleDto {
  classId?: string;
  courseName?: string;
  courseCode?: string;
  teacherName?: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
}
