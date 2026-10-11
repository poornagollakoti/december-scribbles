import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  GALLERY_SORTS,
  GALLERY_VISIBILITIES,
  INSTAGRAM_POST_PATTERN,
  type AdminGalleryListQuery,
  type GallerySort,
  type GalleryVisibility,
  LIMITS,
  SLUG_PATTERN,
  type GalleryListQuery,
  type GalleryUpsertRequest,
} from '@ds/contracts';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Trim, TrimToNull } from '../../../common/utils/text';

export class CreateGalleryItemDto implements GalleryUpsertRequest {
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
  @Matches(SLUG_PATTERN, {
    message: 'slug may only contain lowercase letters, numbers and single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ maxLength: LIMITS.descriptionMax, nullable: true })
  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(LIMITS.descriptionMax)
  description?: string | null;

  @ApiPropertyOptional({ maxLength: LIMITS.categoryMax, nullable: true })
  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(LIMITS.categoryMax)
  category?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  imageId: string;

  @ApiProperty({
    maxLength: LIMITS.altTextMax,
    description: 'Describes the image for screen readers',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.altTextMax)
  altText: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  displayOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://www.instagram.com/p/AbC123/',
    description: 'Link to the original Instagram post or reel',
  })
  @IsOptional()
  @TrimToNull()
  @ValidateIf((_o, v) => v !== null)
  @Matches(INSTAGRAM_POST_PATTERN, {
    message:
      'instagramUrl must be an Instagram post or reel link (https://www.instagram.com/p/...)',
  })
  instagramUrl?: string | null;
}

export class UpdateGalleryItemDto extends PartialType(CreateGalleryItemDto) {}

export class AdminGalleryListQueryDto extends PaginationQueryDto implements AdminGalleryListQuery {
  @ApiPropertyOptional({ enum: GALLERY_VISIBILITIES })
  @IsOptional()
  @IsIn(GALLERY_VISIBILITIES)
  visibility?: GalleryVisibility;

  @ApiPropertyOptional({ maxLength: LIMITS.categoryMax })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(LIMITS.categoryMax)
  category?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: GALLERY_SORTS, default: 'order' })
  @IsOptional()
  @IsIn(GALLERY_SORTS)
  sort?: GallerySort;
}

export class GalleryListQueryDto extends PaginationQueryDto implements GalleryListQuery {
  @ApiPropertyOptional({ maxLength: LIMITS.categoryMax })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(LIMITS.categoryMax)
  category?: string;

  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITS.pageSizeMax)
  override pageSize: number = 24;
}
