import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LIMITS, type SiteProfileUpdateRequest } from '@ds/contracts';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim, TrimToNull } from '../../../common/utils/text';

export class UpdateSiteProfileDto implements SiteProfileUpdateRequest {
  @ApiProperty({ maxLength: LIMITS.titleMax })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.titleMax)
  displayName: string;

  @ApiProperty({ maxLength: LIMITS.excerptMax })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.excerptMax)
  tagline: string;

  @ApiProperty({
    maxLength: LIMITS.bodyMax,
    description: 'Plain text; paragraphs separated by blank lines',
  })
  @Trim()
  @IsString()
  @MaxLength(LIMITS.bodyMax)
  aboutBody: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @TrimToNull()
  @IsEmail()
  @MaxLength(LIMITS.emailMax)
  contactEmail?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @TrimToNull()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(300)
  instagramUrl?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Image shown in the About section',
  })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsUUID()
  aboutImageId?: string | null;
}
