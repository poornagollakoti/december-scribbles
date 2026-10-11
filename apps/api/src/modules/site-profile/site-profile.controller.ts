import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SiteProfile } from '@ds/contracts';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import { UpdateSiteProfileDto } from './dto/site-profile.dto';
import { SiteProfileService } from './site-profile.service';

@ApiTags('site profile')
@Controller()
export class SiteProfileController {
  constructor(private readonly profile: SiteProfileService) {}

  @Get('site-profile')
  @ApiOperation({ summary: 'Brand name, tagline, about text and contact links' })
  get(): Promise<SiteProfile> {
    return this.profile.get();
  }

  @Put('admin/site-profile')
  @ApiTags('admin: site profile')
  @ApiCookieAuth()
  @Roles('ADMIN')
  @UseGuards(SessionGuard, RolesGuard)
  update(@Body() dto: UpdateSiteProfileDto): Promise<SiteProfile> {
    return this.profile.update(dto);
  }
}
