
export interface CompleteSocialRegistrationDto {
  userType: string;
  firstName: string;
  lastName: string;
  currentGrade?: number;
  schoolName?: string;
  middleName?: string;
  government?: string;
  town?: string;
  phoneNumber?: string;
  address?: string;
}

export interface SocialRegistrationResultDto {
  userType?: string;
  actorId?: string;
}
