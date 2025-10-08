import { mapEnumToOptions } from '@abp/ng.core';

export enum enFeedType {
  Announcement = 0,
  Event = 1,
  Reminder = 2,
  Feedback = 3,
}

export const enFeedTypeOptions = mapEnumToOptions(enFeedType);
