import type { FullAuditedEntityDto, PagedAndSortedResultRequestDto } from '@abp/ng.core';

export interface CreateUpdateMarketingLeadDto {
  name: string;
  mobile: string;
  city?: string;
  course?: string;
  address?: string;
  isCalled: boolean;
}

export interface GetMarketingLeadsInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  isCalled?: boolean;
}

export interface MarketingLeadDto extends FullAuditedEntityDto<string> {
  name?: string;
  mobile?: string;
  city?: string;
  course?: string;
  address?: string;
  isCalled: boolean;
}
