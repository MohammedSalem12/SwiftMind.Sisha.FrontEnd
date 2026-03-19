import type { CreationAuditedEntityDto } from '@abp/ng.core';
import type { PasswordResetRequestStatus } from './password-reset-request-status.enum';

export interface CreatePasswordResetRequestDto {
  userNameOrContact: string;
  displayName?: string;
}

export interface PasswordResetRequestDto extends CreationAuditedEntityDto<string> {
  userNameOrContact?: string;
  displayName?: string;
  status?: PasswordResetRequestStatus;
  adminNotes?: string;
  resolvedTime?: string;
  resolvedByUserId?: string;
}

export interface ResolvePasswordResetDto {
  newPassword: string;
  adminNotes?: string;
}
