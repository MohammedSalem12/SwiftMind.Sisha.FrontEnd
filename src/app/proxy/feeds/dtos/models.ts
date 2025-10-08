import type { enFeedType } from '../en-feed-type.enum';
import type { TargetAudienceType } from '../enums/target-audience-type.enum';
import type { FullAuditedEntityDto } from '@abp/ng.core';

export interface CreateUpdateFeedAttachmentDto {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface CreateUpdateFeedDto {
  title: string;
  content: string;
  feedType: enFeedType;
  targetAudienceType: TargetAudienceType;
  targetIds: string[];
  isPinned: boolean;
  isPublished: boolean;
  publishDate?: string;
  attachments: CreateUpdateFeedAttachmentDto[];
}

export interface FeedAttachmentDto {
  id?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export interface FeedDto extends FullAuditedEntityDto<string> {
  title?: string;
  content?: string;
  feedType?: enFeedType;
  targetAudienceType?: TargetAudienceType;
  targetIds: string[];
  isPinned: boolean;
  isPublished: boolean;
  publishDate?: string;
  createdByUserId?: string;
  createdByUserName?: string;
  attachments: FeedAttachmentDto[];
}
