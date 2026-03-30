import type { PointTransactionDto, RedeemPointsDto, RedeemableAdvertiserDto, ReferralInfoDto, StudentPointsDto } from './models';
import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StudentPointsService {
  apiName = 'Default';
  

  awardEnrollmentPoints = (studentId: string, enrollmentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/student-points/award-enrollment-points',
      params: { studentId, enrollmentId },
    },
    { apiName: this.apiName,...config });
  

  awardReferralPoints = (referrerStudentId: string, newStudentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/student-points/award-referral-points',
      params: { referrerStudentId, newStudentId },
    },
    { apiName: this.apiName,...config });
  

  awardRegistrationPoints = (studentId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/student-points/award-registration-points/${studentId}`,
    },
    { apiName: this.apiName,...config });
  

  getMyBalance = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, StudentPointsDto>({
      method: 'GET',
      url: '/api/app/student-points/my-balance',
    },
    { apiName: this.apiName,...config });
  

  getMyReferralInfo = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, ReferralInfoDto>({
      method: 'GET',
      url: '/api/app/student-points/my-referral-info',
    },
    { apiName: this.apiName,...config });
  

  getMyTransactions = (skipCount?: number, maxResultCount: number = 50, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PointTransactionDto[]>({
      method: 'GET',
      url: '/api/app/student-points/my-transactions',
      params: { skipCount, maxResultCount },
    },
    { apiName: this.apiName,...config });
  

  getRedeemableAdvertisers = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, RedeemableAdvertiserDto[]>({
      method: 'GET',
      url: '/api/app/student-points/redeemable-advertisers',
    },
    { apiName: this.apiName,...config });
  

  redeemPoints = (input: RedeemPointsDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, string>({
      method: 'POST',
      responseType: 'text',
      url: '/api/app/student-points/redeem-points',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
