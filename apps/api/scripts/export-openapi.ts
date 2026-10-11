/**
 * Writes the OpenAPI document to docs/openapi.json without starting the HTTP server.
 * Uses placeholder configuration: no database or storage connection is made.
 */
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
process.env.FRONTEND_ORIGINS ??= 'http://localhost:3000';
process.env.S3_BUCKET ??= 'placeholder';
process.env.S3_ACCESS_KEY_ID ??= 'placeholder';
process.env.S3_SECRET_ACCESS_KEY ??= 'placeholder';
process.env.MEDIA_PUBLIC_BASE_URL ??= 'http://localhost:9000/placeholder';

async function main(): Promise<void> {
  const { AppModule } = await import('../src/app.module');
  const { configureApp, createOpenApiDocument } = await import('../src/setup');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false, // create() wires providers but runs no lifecycle hooks, so no DB connection
  });
  configureApp(app);
  const document = createOpenApiDocument(app);
  const target = resolve(__dirname, '../../../docs/openapi.json');
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  console.log(`OpenAPI document written to ${target}`);
  await app.close();
}

void main();
