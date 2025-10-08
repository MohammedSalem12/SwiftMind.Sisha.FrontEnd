import type { EntityDto } from '@abp/ng.core';

export interface GradeDto extends EntityDto<string> {
  name?: string;
  order: number;
}
