
export interface CompleteSocialRegistrationDto {
  tempUserId: string;
  selectedRole: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  studentData: StudentRegistrationData;
  teacherData: TeacherRegistrationData;
  parentData: ParentRegistrationData;
}

export interface ParentRegistrationData {
  occupation?: string;
  workPlace?: string;
  emergencyContact?: string;
}

export interface SocialAuthResultDto {
  isSuccess: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  requiresRoleSelection: boolean;
  requiresProfileCompletion: boolean;
  tempUserId?: string;
  email?: string;
  name?: string;
  errorMessage?: string;
}

export interface SocialAuthUrlDto {
  authUrl?: string;
  state?: string;
}

export interface SocialLoginDto {
  provider: string;
  email: string;
  providerId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

export interface StudentRegistrationData {
  studentCode?: string;
  schoolName?: string;
  gradeLevel?: number;
}

export interface TeacherRegistrationData {
  teacherCode?: string;
  specialization?: string;
  yearsOfExperience?: number;
  qualifications?: string;
}
