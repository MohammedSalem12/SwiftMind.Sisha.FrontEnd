import { mapEnumToOptions } from '@abp/ng.core';

export enum AdvertiserType {
  Teacher = 0,
  Library = 1,
  Bookstore = 2,
  EducationalCenter = 3,
  Other = 4,
}

export const advertiserTypeOptions = mapEnumToOptions(AdvertiserType);
