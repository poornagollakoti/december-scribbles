import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../src/database/prisma.service';
import { createTestApp, createUser, login, PASSWORD, resetDatabase } from './helpers';

describe('Authentication (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    await createUser(prisma, 'admin@example.com', 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a wrong password with a generic message', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong-password' })
      .expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, message: 'Invalid email or password' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects malformed login payloads', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: PASSWORD, admin: true })
      .expect(400);
    expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual([
      'admin',
      'email',
    ]);
  });

  it('signs in with a hardened cookie, serves /me, and revokes the session on logout', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: '  ADMIN@example.com ', password: PASSWORD })
      .expect(200);
    expect(res.body).toMatchObject({ email: 'admin@example.com', role: 'ADMIN' });
    expect(res.body.passwordHash).toBeUndefined();
    const setCookie = ([] as string[]).concat(res.headers['set-cookie'])[0];
    expect(setCookie).toMatch(/ds_session=/);
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    const cookie = setCookie.split(';')[0];

    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .expect(204);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
  });

  it('rejects forged session tokens', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', 'ds_session=forged')
      .expect(401);
  });

  it('rejects cross-origin state-changing requests even with a valid session', async () => {
    const cookie = await login(app, 'admin@example.com');
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example')
      .expect(403);
    expect(res.body.message).toBe('Cross-origin request rejected');
    // The allowed frontend origin works.
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', 'http://localhost:3000')
      .expect(204);
  });

  it('rate-limits login attempts', async () => {
    // 4 login requests have been made above; the limit is 5 per minute per client.
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrong' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: PASSWORD })
      .expect(429);
  });
});
