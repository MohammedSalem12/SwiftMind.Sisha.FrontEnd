import { mapEnumToOptions } from '@abp/ng.core';

export enum AdTargetAudience {
  All = 0,
  Students = 1,
  Parents = 2,
  Teachers = 3,
  SpecificGrades = 4,
}

export const adTargetAudienceOptions = mapEnumToOptions(AdTargetAudience);
