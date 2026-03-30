import type { FullAuditedEntityDto } from '@abp/ng.core';
import type { UserRegistrationType } from '../domain/shared/enums/user-registration-type.enum';
import type { RegistrationRequestStatus } from './registration-request-status.enum';

export interface RegistrationRequestDto extends FullAuditedEntityDto<string> {
  userId?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  requestedType?: UserRegistrationType;
  status?: RegistrationRequestStatus;
  rejectionReason?: string;
  reviewedByUserId?: string;
  reviewedAt?: string;
  fullName?: string;
  requestedTypeName?: string;
}

export interface RejectRegistrationRequestDto {
  reason?: string;
}
