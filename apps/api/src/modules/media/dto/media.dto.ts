import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LIMITS, type MediaUpdateRequest } from '@ds/contracts';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/utils/text';

/** Text fields of the multipart upload; the file itself is handled by multer. */
export class UploadMediaDto {
  @ApiPropertyOptional({ maxLength: LIMITS.altTextMax })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(LIMITS.altTextMax)
  altText?: string;
}

export class UpdateMediaDto implements MediaUpdateRequest {
  @ApiProperty({ maxLength: LIMITS.altTextMax })
  @Trim()
  @IsString()
  @MaxLength(LIMITS.altTextMax)
  altText: string;
}
