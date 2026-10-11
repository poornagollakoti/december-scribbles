import type { Role } from '@ds/contracts';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { PasswordService } from '../src/modules/users/password.service';
import { configureApp } from '../src/setup';

export const PASSWORD = 'correct-horse-battery-staple';

/** Boots the full application exactly as main.ts does, against the test database. */
export async function createTestApp(): Promise<{
  app: NestExpressApplication;
  prisma: PrismaService;
}> {
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error('Refusing to run e2e tests against a non-test database');
  }
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

/** Deletes all rows, children first. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$transaction([
    prisma.session.deleteMany(),
    prisma.enquiry.deleteMany(),
    prisma.galleryItem.deleteMany(),
    prisma.content.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.adminUser.deleteMany(),
    prisma.siteProfile.deleteMany(),
  ]);
}

export async function createUser(prisma: PrismaService, email: string, role: Role): Promise<void> {
  await prisma.adminUser.create({
    data: {
      email,
      name: email.split('@')[0],
      role,
      passwordHash: await new PasswordService().hash(PASSWORD),
    },
  });
}

/** Signs in and returns the session cookie header. */
export async function login(app: NestExpressApplication, email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0];
  if (!cookie) throw new Error('No session cookie returned');
  return cookie.split(';')[0];
}
