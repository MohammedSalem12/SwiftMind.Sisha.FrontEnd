import type { CreationAuditedEntityDto } from '@abp/ng.core';
import type { PointTransactionType } from './point-transaction-type.enum';

export interface PointTransactionDto extends CreationAuditedEntityDto<string> {
  studentId?: string;
  amount: number;
  type?: PointTransactionType;
  description?: string;
  descriptionEn?: string;
  relatedEntityId?: string;
}

export interface RedeemPointsDto {
  advertiserId: string;
  pointsToSpend: number;
}

export interface RedeemableAdvertiserDto {
  id?: string;
  name?: string;
  nameEn?: string;
  logoUrl?: string;
  type: number;
  address?: string;
}

export interface ReferralInfoDto {
  referralCode?: string;
  successfulReferrals: number;
  totalReferralPoints: number;
}

export interface StudentPointsDto {
  studentId?: string;
  totalEarned: number;
  totalSpent: number;
  balance: number;
  referralCode?: string;
}
