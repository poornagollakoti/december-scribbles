import { VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { SESSION_COOKIE } from './common/types';
import { createValidationPipe } from './common/utils/validation';
import { AppConfigService } from './config/app-config.service';

/**
 * HTTP pipeline shared by `main.ts` and the e2e tests, so tests exercise exactly the
 * production configuration.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.set('trust proxy', config.get('TRUST_PROXY_HOPS'));
  app.disable('x-powered-by');
  // Swagger UI needs inline scripts/styles, so the docs route gets helmet without CSP.
  const strictHeaders = helmet();
  const docsHeaders = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path.startsWith('/api/docs') ? docsHeaders(req, res, next) : strictHeaders(req, res, next),
  );
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '200kb' });
  app.enableCors({
    origin: config.get('FRONTEND_ORIGINS'),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(createValidationPipe());
  app.enableShutdownHooks();
}

export function createOpenApiDocument(app: NestExpressApplication): OpenAPIObject {
  const options = new DocumentBuilder()
    .setTitle('December Scribbles API')
    .setDescription(
      'Public content, gallery and enquiry endpoints, plus session-authenticated administration. ' +
        'All errors use the `ApiError` shape: { statusCode, error, message, details?, requestId, path, timestamp }.',
    )
    .setVersion('1.0')
    .addCookieAuth(SESSION_COOKIE)
    .build();
  return SwaggerModule.createDocument(app, options);
}
