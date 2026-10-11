import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { configureApp, createOpenApiDocument } from './setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);

  const config = app.get(AppConfigService);
  if (config.get('swaggerEnabled')) {
    SwaggerModule.setup('api/docs', app, createOpenApiDocument(app));
  }

  const port = config.get('PORT');
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();
