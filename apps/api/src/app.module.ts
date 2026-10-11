import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { OriginGuard } from './common/guards/origin.guard';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { SiteProfileModule } from './modules/site-profile/site-profile.module';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.get('NODE_ENV') === 'test' ? 'silent' : config.get('LOG_LEVEL'),
          // Correlation id: reuse a well-formed incoming X-Request-Id, otherwise generate one.
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const incoming = req.headers['x-request-id'];
            const id =
              typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)
                ? incoming
                : randomUUID();
            res.setHeader('X-Request-Id', id);
            return id;
          },
          // Log only what is needed to trace a request; never bodies or full header sets.
          serializers: {
            req: (req: { id: unknown; method: string; url: string }) => ({
              id: req.id,
              method: req.method,
              url: req.url,
            }),
            res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
          },
          redact: {
            paths: [
              'req.headers.cookie',
              'req.headers.authorization',
              'res.headers["set-cookie"]',
              '*.password',
              '*.passwordHash',
            ],
            censor: '[redacted]',
          },
          autoLogging: { ignore: (req: IncomingMessage) => req.url?.includes('/health') ?? false },
          transport: config.get('isProduction')
            ? undefined
            : {
                target: 'pino-pretty',
                options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
              },
        },
      }),
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    MediaModule,
    ContentModule,
    GalleryModule,
    EnquiriesModule,
    SiteProfileModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
