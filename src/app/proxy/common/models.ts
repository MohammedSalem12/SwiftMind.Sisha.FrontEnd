import type { UserRegistrationType } from '../domain/shared/enums/user-registration-type.enum';

export interface CurrentUserActorDto {
  actorId?: string;
  actorType?: string;
  actorName?: string;
  actorCode?: string;
  userRoles: string[];
  userId?: string;
  userName?: string;
  email?: string;
  currentGrade?: number;
  linkedStudentIds: string[];
}

export interface RegisterUserDto {
  userType: UserRegistrationType;
  userName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  address?: string;
  occupation?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  grade?: string;
  parentContact?: string;
  department?: string;
  qualification?: string;
  employeeId?: string;
  hireDate?: string;
  position?: string;
  responsibilities?: string;
}

export interface UserRegBaseDto {
  userName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password: string;
}

export interface UserRegParentDto extends UserRegBaseDto {
}

export interface UserRegSecretaryDto extends UserRegBaseDto {
}

export interface UserRegStudentDto extends UserRegBaseDto {
  grade: number;
  referralCode?: string;
}

export interface UserRegTeacherDto extends UserRegBaseDto {
}

export interface UserRegistrationResultDto {
  userId?: string;
  userName?: string;
  email?: string;
  emailConfirmed: boolean;
  userType?: UserRegistrationType;
  userCode?: string;
  userProfile: object;
  fullName?: string;
  assignedRoles: string[];
  isPendingApproval: boolean;
}

export interface UserRegistrationTypeDto {
  type?: UserRegistrationType;
  name?: string;
  description?: string;
  requiredFields: string[];
}
