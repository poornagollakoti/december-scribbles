import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type { PrismaService } from '../src/database/prisma.service';
import { createTestApp, resetDatabase } from './helpers';

describe('Public API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    await prisma.content.createMany({
      data: [
        {
          slug: 'published-poem',
          title: 'Published poem',
          body: 'a\nb',
          kind: 'POEM',
          status: 'PUBLISHED',
          publishedAt: new Date('2026-01-02'),
        },
        {
          slug: 'older-quote',
          title: 'Older quote',
          body: 'q',
          kind: 'QUOTE',
          status: 'PUBLISHED',
          publishedAt: new Date('2026-01-01'),
        },
        { slug: 'secret-draft', title: 'Draft', body: 'x', kind: 'POEM', status: 'DRAFT' },
        {
          slug: 'archived',
          title: 'Archived',
          body: 'x',
          kind: 'PROSE',
          status: 'ARCHIVED',
          publishedAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health', () => {
    it('reports liveness and database readiness with a correlation id', async () => {
      const live = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
      expect(live.body.status).toBe('ok');
      expect(live.headers['x-request-id']).toBeDefined();
      const ready = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
      expect(ready.body).toEqual({ status: 'ok', checks: { database: 'up' } });
    });

    it('echoes a well-formed incoming request id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('X-Request-Id', 'trace-12345678');
      expect(res.headers['x-request-id']).toBe('trace-12345678');
    });
  });

  describe('content', () => {
    it('lists only published writing, newest first', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/content').expect(200);
      expect(res.body.items.map((i: { slug: string }) => i.slug)).toEqual([
        'published-poem',
        'older-quote',
      ]);
      expect(res.body).toMatchObject({ total: 2, page: 1, totalPages: 1 });
      expect(res.body.items[0].body).toBeUndefined();
    });

    it('filters by kind and paginates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/content?kind=QUOTE&pageSize=1')
        .expect(200);
      expect(res.body).toMatchObject({ total: 1, pageSize: 1, items: [{ slug: 'older-quote' }] });
    });

    it('rejects invalid query parameters', async () => {
      await request(app.getHttpServer()).get('/api/v1/content?kind=SONG').expect(400);
      await request(app.getHttpServer()).get('/api/v1/content?page=0').expect(400);
      await request(app.getHttpServer()).get('/api/v1/content?pageSize=1000').expect(400);
    });

    it('returns published detail with body, and 404 for drafts and archived pieces', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/content/published-poem')
        .expect(200);
      expect(res.body.body).toBe('a\nb');
      await request(app.getHttpServer()).get('/api/v1/content/secret-draft').expect(404);
      await request(app.getHttpServer()).get('/api/v1/content/archived').expect(404);
    });

    it('links each piece to its published neighbours, skipping unpublished ones', async () => {
      const newest = await request(app.getHttpServer()).get('/api/v1/content/published-poem');
      expect(newest.body.newer).toBeNull();
      expect(newest.body.older).toEqual({
        slug: 'older-quote',
        title: 'Older quote',
        kind: 'QUOTE',
      });
      const oldest = await request(app.getHttpServer()).get('/api/v1/content/older-quote');
      expect(oldest.body.newer).toMatchObject({ slug: 'published-poem' });
      expect(oldest.body.older).toBeNull();
    });

    it('counts published pieces per type', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/content/meta/kinds').expect(200);
      expect(res.body).toEqual([
        { kind: 'POEM', count: 1 },
        { kind: 'QUOTE', count: 1 },
      ]);
    });
  });

  it('serves the default site profile before one is saved', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/site-profile').expect(200);
    expect(res.body).toMatchObject({
      displayName: 'December Scribbles',
      instagramUrl: expect.stringContaining('instagram.com'),
    });
  });

  describe('enquiries', () => {
    const valid = {
      name: 'Visitor',
      email: 'Visitor@Example.com',
      type: 'GENERAL',
      message: 'I loved your latest poem!',
    };

    it('accepts a valid enquiry and stores it', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/enquiries')
        .send(valid)
        .expect(201);
      expect(res.body).toEqual({ id: expect.any(String), receivedAt: expect.any(String) });
      const stored = await prisma.enquiry.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(stored).toMatchObject({ email: 'visitor@example.com', status: 'NEW' });
      // Email is not configured in tests, so the reason is recorded.
      expect(stored.notificationError).toMatch(/not configured/);
    });

    it('returns field-level errors for invalid input', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/enquiries')
        .send({ name: ' ', email: 'nope', type: 'SPAM', message: 'short', isAdmin: true })
        .expect(400);
      const fields = res.body.details.map((d: { field: string }) => d.field);
      expect(fields).toEqual(
        expect.arrayContaining(['name', 'email', 'type', 'message', 'isAdmin']),
      );
    });

    it('pretends to accept honeypot submissions without storing them', async () => {
      const before = await prisma.enquiry.count();
      await request(app.getHttpServer())
        .post('/api/v1/enquiries')
        .send({ ...valid, website: 'spam' })
        .expect(201);
      expect(await prisma.enquiry.count()).toBe(before);
    });

    it('rate-limits submissions per client', async () => {
      // 3 enquiry requests above; the limit is 5 per 10 minutes.
      await request(app.getHttpServer()).post('/api/v1/enquiries').send(valid).expect(201);
      await request(app.getHttpServer()).post('/api/v1/enquiries').send(valid).expect(201);
      const res = await request(app.getHttpServer())
        .post('/api/v1/enquiries')
        .send(valid)
        .expect(429);
      expect(res.body.statusCode).toBe(429);
    });
  });
});
