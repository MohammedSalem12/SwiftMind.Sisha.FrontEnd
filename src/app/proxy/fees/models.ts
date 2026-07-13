
export interface FeeCourseOptionDto {
  courseId?: string;
  name?: string;
}

export interface FeeFilterOptionsDto {
  courses: FeeCourseOptionDto[];
  groups: FeeGroupOptionDto[];
}

export interface FeeGroupOptionDto {
  groupId?: string;
  name?: string;
  courseId?: string;
}

export interface FeeStudentRowDto {
  enrollmentId?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  photoUrl?: string;
  courseId?: string;
  courseName?: string;
  groupId?: string;
  groupName?: string;
  year: number;
  wholeCoursePaid: boolean;
  paidMonths: number[];
}

export interface GetFeesInput {
  courseId?: string;
  groupId?: string;
  year: number;
}

export interface MarkFeeMonthInput {
  enrollmentId: string;
  year: number;
  month: number;
  isPaid: boolean;
  amount?: number;
}

export interface MarkWholeCourseInput {
  enrollmentId: string;
  isPaid: boolean;
  amount?: number;
}
