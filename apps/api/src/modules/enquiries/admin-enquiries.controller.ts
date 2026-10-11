import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { AdminEnquiry, Paginated } from '@ds/contracts';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import { AdminEnquiryListQueryDto, EnquiryStatusUpdateDto } from './dto/enquiry.dto';
import { EnquiriesService } from './enquiries.service';

/** Enquiries contain visitors' personal data, so only ADMINs can see them. */
@ApiTags('admin: enquiries')
@ApiCookieAuth()
@Roles('ADMIN')
@UseGuards(SessionGuard, RolesGuard)
@Controller('admin/enquiries')
export class AdminEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  list(@Query() query: AdminEnquiryListQueryDto): Promise<Paginated<AdminEnquiry>> {
    return this.enquiries.list(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<AdminEnquiry> {
    return this.enquiries.getById(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnquiryStatusUpdateDto,
  ): Promise<AdminEnquiry> {
    return this.enquiries.updateStatus(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.enquiries.remove(id);
  }
}
