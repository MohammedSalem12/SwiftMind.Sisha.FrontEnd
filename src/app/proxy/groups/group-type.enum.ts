import { mapEnumToOptions } from '@abp/ng.core';

export enum GroupType {
  Offline = 0,
  Online = 1,
}

export const groupTypeOptions = mapEnumToOptions(GroupType);
