import type { EntityDto } from '@abp/ng.core';

export interface CreateUpdateTeacherRatingDto {
  teacherId: string;
  stars: number;
  comment?: string;
}

export interface TeacherRatingDto extends EntityDto<string> {
  teacherId?: string;
  parentId?: string;
  parentName?: string;
  stars: number;
  comment?: string;
  creationTime?: string;
}

export interface TeacherRatingSummaryDto {
  teacherId?: string;
  averageRating: number;
  ratingCount: number;
  myRating: TeacherRatingDto;
  recent: TeacherRatingDto[];
}
