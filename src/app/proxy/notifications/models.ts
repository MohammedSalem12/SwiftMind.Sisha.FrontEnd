import type { CreationAuditedEntityDto } from '@abp/ng.core';
import type { NotificationType } from './notification-type.enum';

export interface NotificationDto extends CreationAuditedEntityDto<string> {
  recipientUserId?: string;
  title?: string;
  message?: string;
  type?: NotificationType;
  isRead: boolean;
  referenceId?: string;
}
