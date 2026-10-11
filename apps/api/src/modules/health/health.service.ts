import { Injectable } from '@nestjs/common';
import type { HealthResponse, ReadinessResponse } from '@ds/contracts';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness(): HealthResponse {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    const database = await this.prisma.$queryRaw`SELECT 1`
      .then(() => 'up' as const)
      .catch(() => 'down' as const);
    return { status: database === 'up' ? 'ok' : 'error', checks: { database } };
  }
}
