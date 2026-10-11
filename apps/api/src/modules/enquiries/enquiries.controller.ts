import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { EnquiryReceipt } from '@ds/contracts';
import { CreateEnquiryDto } from './dto/enquiry.dto';
import { EnquiriesService } from './enquiries.service';

@ApiTags('enquiries')
@Controller('enquiries')
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  @ApiOperation({ summary: 'Send a message to December Scribbles' })
  @ApiCreatedResponse({ description: 'Enquiry received' })
  @ApiTooManyRequestsResponse({ description: 'More than 5 enquiries in 10 minutes from one IP' })
  submit(@Body() dto: CreateEnquiryDto): Promise<EnquiryReceipt> {
    return this.enquiries.submit(dto);
  }
}
