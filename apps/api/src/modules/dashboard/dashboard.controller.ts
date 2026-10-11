import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { DashboardStats } from '@ds/contracts';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SessionGuard } from '../auth/session.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('admin: dashboard')
@ApiCookieAuth()
@UseGuards(SessionGuard, RolesGuard)
@Controller('admin/stats')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  stats(): Promise<DashboardStats> {
    return this.dashboard.stats();
  }
}
