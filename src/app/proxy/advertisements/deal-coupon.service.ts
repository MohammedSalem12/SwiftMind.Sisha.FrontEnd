import type { DealCouponDto, DealRedemptionDto, DealSettlementDto, RedeemCouponDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DealCouponService {
  apiName = 'Default';
  

  getCouponByCode = (code: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealCouponDto>({
      method: 'GET',
      url: '/api/app/deal-coupon/coupon-by-code',
      params: { code },
    },
    { apiName: this.apiName,...config });
  

  getMyActiveCoupons = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealCouponDto[]>({
      method: 'GET',
      url: '/api/app/deal-coupon/my-active-coupons',
    },
    { apiName: this.apiName,...config });
  

  getMyRedemptions = (skipCount?: number, maxResultCount: number = 50, config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealRedemptionDto[]>({
      method: 'GET',
      url: '/api/app/deal-coupon/my-redemptions',
      params: { skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getRedemptionsByAdvertisement = (advertisementId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealRedemptionDto[]>({
      method: 'GET',
      url: `/api/app/deal-coupon/redemptions-by-advertisement/${advertisementId}`,
    },
    { apiName: this.apiName,...config });
  

  getSettlementReport = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealSettlementDto[]>({
      method: 'GET',
      url: '/api/app/deal-coupon/settlement-report',
    },
    { apiName: this.apiName,...config });
  

  redeemCoupon = (input: RedeemCouponDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, DealRedemptionDto>({
      method: 'POST',
      url: '/api/app/deal-coupon/redeem-coupon',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
