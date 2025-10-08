import { mapEnumToOptions } from '@abp/ng.core';

export enum TargetAudienceType {
  All = 0,
  Teachers = 1,
  Parents = 2,
  Students = 3,
  SpecificGroup = 4,
}

export const targetAudienceTypeOptions = mapEnumToOptions(TargetAudienceType);
