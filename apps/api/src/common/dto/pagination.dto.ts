import { ApiPropertyOptional } from '@nestjs/swagger';
import { LIMITS, type Paginated } from '@ds/contracts';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: LIMITS.pageSizeMax, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITS.pageSizeMax)
  pageSize: number = 12;
}

export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationQueryDto,
): Paginated<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function skipTake({ page, pageSize }: PaginationQueryDto): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
