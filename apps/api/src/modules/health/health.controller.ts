import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { HealthResponse, ReadinessResponse } from '@ds/contracts';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness: the process is up' })
  live(): HealthResponse {
    return this.health.liveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness: dependencies (database) are reachable; 503 otherwise' })
  async ready(@Res({ passthrough: true }) res: Response): Promise<ReadinessResponse> {
    const result = await this.health.readiness();
    if (result.status !== 'ok') res.status(503);
    return result;
  }
}
