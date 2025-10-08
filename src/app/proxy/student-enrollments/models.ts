import type { EnrollmentRequestInitiator } from '../enums/enrollment-request-initiator.enum';
import type { EnrollmentRequestStatus } from '../enums/enrollment-request-status.enum';

export interface EnrollmentRequestApproveDto {
  requestId?: string;
  isParent: boolean;
}

export interface EnrollmentRequestCreateDto {
  studentId?: string;
  parentId?: string;
  courseId?: string;
  teacherId?: string;
  initiator?: EnrollmentRequestInitiator;
}

export interface EnrollmentRequestDto {
  id?: string;
  studentId?: string;
  parentId?: string;
  courseId?: string;
  teacherId?: string;
  initiator?: EnrollmentRequestInitiator;
  status?: EnrollmentRequestStatus;
  isParentApproved: boolean;
  isTeacherApproved: boolean;
}
