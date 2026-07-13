import type { EntityDto } from '@abp/ng.core';

export interface AcademyRatingDto extends EntityDto<string> {
  academyId?: string;
  parentId?: string;
  parentName?: string;
  stars: number;
  comment?: string;
  creationTime?: string;
}

export interface AcademyRatingSummaryDto {
  academyId?: string;
  averageRating: number;
  ratingCount: number;
  myRating: AcademyRatingDto;
  recent: AcademyRatingDto[];
}

export interface CreateUpdateAcademyRatingDto {
  academyId: string;
  stars: number;
  comment?: string;
}
