import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ENQUIRY_STATUSES,
  ENQUIRY_TYPES,
  LIMITS,
  type AdminEnquiryListQuery,
  type CreateEnquiryRequest,
  type EnquiryStatus,
  type EnquiryStatusUpdateRequest,
  type EnquiryType,
} from '@ds/contracts';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Trim, TrimToNull } from '../../../common/utils/text';

export class CreateEnquiryDto implements CreateEnquiryRequest {
  @ApiProperty({ maxLength: LIMITS.nameMax })
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Please tell us your name' })
  @MaxLength(LIMITS.nameMax)
  name: string;

  @ApiProperty({ maxLength: LIMITS.emailMax })
  @Trim()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(LIMITS.emailMax)
  email: string;

  @ApiProperty({ enum: ENQUIRY_TYPES })
  @IsIn(ENQUIRY_TYPES)
  type: EnquiryType;

  @ApiPropertyOptional({ maxLength: LIMITS.subjectMax })
  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(LIMITS.subjectMax)
  subject?: string;

  @ApiProperty({ minLength: LIMITS.messageMin, maxLength: LIMITS.messageMax })
  @Trim()
  @IsString()
  @MinLength(LIMITS.messageMin, {
    message: `Message must be at least ${LIMITS.messageMin} characters`,
  })
  @MaxLength(LIMITS.messageMax)
  message: string;

  @ApiPropertyOptional({ description: 'Honeypot field. Leave empty.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class EnquiryStatusUpdateDto implements EnquiryStatusUpdateRequest {
  @ApiProperty({ enum: ENQUIRY_STATUSES })
  @IsIn(ENQUIRY_STATUSES)
  status: EnquiryStatus;
}

export class AdminEnquiryListQueryDto extends PaginationQueryDto implements AdminEnquiryListQuery {
  @ApiPropertyOptional({ enum: ENQUIRY_STATUSES })
  @IsOptional()
  @IsIn(ENQUIRY_STATUSES)
  status?: EnquiryStatus;
}
