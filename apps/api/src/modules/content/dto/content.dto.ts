import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  CONTENT_KINDS,
  CONTENT_STATUSES,
  LIMITS,
  SLUG_PATTERN,
  type AdminContentListQuery,
  type ContentKind,
  type ContentListQuery,
  type ContentStatus,
  type ContentUpsertRequest,
} from '@ds/contracts';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Trim, TrimToNull } from '../../../common/utils/text';

const SLUG_MESSAGE = 'slug may only contain lowercase letters, numbers and single hyphens';

export class CreateContentDto implements ContentUpsertRequest {
  @ApiProperty({ maxLength: LIMITS.titleMax })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.titleMax)
  title: string;

  @ApiPropertyOptional({
    maxLength: LIMITS.slugMax,
    description: 'Generated from the title if omitted',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(LIMITS.slugMax)
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  slug?: string;

  @ApiPropertyOptional({ maxLength: LIMITS.excerptMax, nullable: true })
  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(LIMITS.excerptMax)
  excerpt?: string | null;

  @ApiProperty({ maxLength: LIMITS.bodyMax, description: 'Plain text; line breaks are preserved' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.bodyMax)
  body: string;

  @ApiProperty({ enum: CONTENT_KINDS })
  @IsIn(CONTENT_KINDS)
  kind: ContentKind;

  @ApiProperty({ enum: CONTENT_STATUSES })
  @IsIn(CONTENT_STATUSES)
  status: ContentStatus;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  coverImageId?: string | null;
}

export class UpdateContentDto extends PartialType(CreateContentDto) {}

export class ContentListQueryDto extends PaginationQueryDto implements ContentListQuery {
  @ApiPropertyOptional({ enum: CONTENT_KINDS })
  @IsOptional()
  @IsIn(CONTENT_KINDS)
  kind?: ContentKind;
}

export class AdminContentListQueryDto extends ContentListQueryDto implements AdminContentListQuery {
  @ApiPropertyOptional({ enum: CONTENT_STATUSES })
  @IsOptional()
  @IsIn(CONTENT_STATUSES)
  status?: ContentStatus;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;
}
