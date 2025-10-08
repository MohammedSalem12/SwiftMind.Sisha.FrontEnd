import type { ExtensibleAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateFeedbackDto {
  enrollmentId: string;
  date: string;
  text: string;
  score?: number;
}

export interface FeedbackDto extends ExtensibleAuditedEntityDto<string> {
  enrollmentId?: string;
  date?: string;
  text?: string;
  score?: number;
}
