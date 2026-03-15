import { mapEnumToOptions } from '@abp/ng.core';

export enum AdType {
  Service = 0,
  Product = 1,
  Deal = 2,
}

export const adTypeOptions = mapEnumToOptions(AdType);
