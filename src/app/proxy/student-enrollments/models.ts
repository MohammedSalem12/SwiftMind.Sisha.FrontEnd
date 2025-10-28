import type { EnrollmentRequestInitiator } from '../enums/enrollment-request-initiator.enum';
import type { EnrollmentRequestStatus } from '../enums/enrollment-request-status.enum';

export interface EnrollmentRequestApproveDto {
  requestId?: string;
  isParent: boolean;
  groupId?: string;
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
  studentName?: string;
  parentId?: string;
  parentName?: string;
  courseId?: string;
  courseName?: string;
  teacherId?: string;
  teacherName?: string;
  groupId?: string;
  groupName?: string;
  initiator?: EnrollmentRequestInitiator;
  status?: EnrollmentRequestStatus;
  isParentApproved: boolean;
  isTeacherApproved: boolean;
  rejectionReason?: string;
  creationTime?: string;
}

export interface EnrollmentRequestRejectDto {
  requestId?: string;
  reason?: string;
}
