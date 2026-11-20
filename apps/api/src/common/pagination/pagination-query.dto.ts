import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { PaginationQuery } from '@symma/shared-types';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export class PaginationQueryDto implements Pick<
  PaginationQuery,
  'page' | 'limit'
> {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}

export class SearchablePaginationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
