import type { EntityDto, FullAuditedEntityDto } from '@abp/ng.core';
import type { AdType } from '../enums/ad-type.enum';
import type { AdStatus } from '../enums/ad-status.enum';
import type { AdTargetAudience } from '../enums/ad-target-audience.enum';
import type { AdvertiserType } from '../enums/advertiser-type.enum';
import type { CouponStatus } from '../enums/coupon-status.enum';

export interface AdModuleSettingsDto {
  isEnabled: boolean;
  requireApproval: boolean;
  maxAdsPerAdvertiser: number;
}

export interface AdReviewDto {
  adId: string;
  approve: boolean;
  notes?: string;
}

export interface AdvertisementDto extends FullAuditedEntityDto<string> {
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  adType?: AdType;
  status?: AdStatus;
  targetAudience?: AdTargetAudience;
  targetGrades: number[];
  advertiserType?: AdvertiserType;
  teacherId?: string;
  advertiserId?: string;
  advertiserName?: string;
  dealPartnerId?: string;
  dealPartnerName?: string;
  price?: number;
  currency?: string;
  contactInfo?: string;
  externalUrl?: string;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  viewCount: number;
  clickCount: number;
  discountPercent: number;
  teacherCommissionPercent: number;
  platformFeePercent: number;
  linkedCourseId?: string;
  linkedCourseName?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface AdvertiserDto extends FullAuditedEntityDto<string> {
  name?: string;
  nameEn?: string;
  type?: AdvertiserType;
  description?: string;
  descriptionEn?: string;
  logoUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  websiteUrl?: string;
  isApproved: boolean;
  userId?: string;
}

export interface AdvertiserLookupDto extends EntityDto<string> {
  name?: string;
  nameEn?: string;
  type?: AdvertiserType;
  logoUrl?: string;
}

export interface CreateUpdateAdvertisementDto {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  imageUrl?: string;
  adType: AdType;
  targetAudience: AdTargetAudience;
  targetGrades: number[];
  dealPartnerId?: string;
  dealPartnerName?: string;
  price?: number;
  currency?: string;
  contactInfo?: string;
  externalUrl?: string;
  startDate?: string;
  endDate?: string;
  discountPercent: number;
  teacherCommissionPercent: number;
  platformFeePercent: number;
  linkedCourseId?: string;
  linkedCourseName?: string;
  submitForReview: boolean;
}

export interface CreateUpdateAdvertiserDto {
  name: string;
  nameEn?: string;
  type: AdvertiserType;
  description?: string;
  descriptionEn?: string;
  logoUrl?: string;
  contactPhone: string;
  contactEmail: string;
  address?: string;
  websiteUrl?: string;
  userId?: string;
}

export interface DealCouponDto extends FullAuditedEntityDto<string> {
  couponCode?: string;
  advertisementId?: string;
  studentId?: string;
  studentName?: string;
  courseId?: string;
  courseName?: string;
  teacherId?: string;
  teacherName?: string;
  discountPercent: number;
  dealDescription?: string;
  advertiserName?: string;
  status?: CouponStatus;
  expiryDate?: string;
  redeemedAt?: string;
}

export interface DealRedemptionDto extends FullAuditedEntityDto<string> {
  couponId?: string;
  couponCode?: string;
  advertisementId?: string;
  studentId?: string;
  studentName?: string;
  advertiserId?: string;
  advertiserName?: string;
  discountPercent: number;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  notes?: string;
  redeemedByUserId?: string;
  teacherId?: string;
  teacherName?: string;
  teacherCommissionPercent: number;
  platformFeePercent: number;
  teacherCommissionAmount?: number;
  platformFeeAmount?: number;
}

export interface DealSettlementDto {
  advertisementId?: string;
  advertisementTitle?: string;
  advertiserName?: string;
  teacherName?: string;
  totalCouponsIssued: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  totalTeacherCommission: number;
  totalPlatformFee: number;
  teacherCommissionPercent: number;
  platformFeePercent: number;
}

export interface RedeemCouponDto {
  couponCode: string;
  originalAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  notes?: string;
}
