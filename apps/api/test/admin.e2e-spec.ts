import type { NestExpressApplication } from '@nestjs/platform-express';
import sharp from 'sharp';
import request from 'supertest';
import type { PrismaService } from '../src/database/prisma.service';
import { createTestApp, createUser, login, resetDatabase } from './helpers';

/**
 * Administrator journeys. Uses S3Mock from docker-compose for media storage.
 */
describe('Administration (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: string;
  let editor: string;
  let imageId: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
    await createUser(prisma, 'admin@example.com', 'ADMIN');
    await createUser(prisma, 'editor@example.com', 'EDITOR');
    admin = await login(app, 'admin@example.com');
    editor = await login(app, 'editor@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('authorisation', () => {
    it.each([
      ['get', '/api/v1/admin/content'],
      ['post', '/api/v1/admin/content'],
      ['get', '/api/v1/admin/gallery'],
      ['post', '/api/v1/admin/media'],
      ['get', '/api/v1/admin/enquiries'],
      ['put', '/api/v1/admin/site-profile'],
      ['get', '/api/v1/admin/stats'],
    ] as const)('%s %s requires a session', async (method, path) => {
      await http()[method](path).expect(401);
    });

    it('lets editors manage content but not read enquiries or change the profile', async () => {
      await http().get('/api/v1/admin/content').set('Cookie', editor).expect(200);
      await http().get('/api/v1/admin/enquiries').set('Cookie', editor).expect(403);
      await http()
        .put('/api/v1/admin/site-profile')
        .set('Cookie', editor)
        .send({ displayName: 'x', tagline: 'y', aboutBody: '' })
        .expect(403);
    });
  });

  describe('media', () => {
    it('rejects files that are not images', async () => {
      await http()
        .post('/api/v1/admin/media')
        .set('Cookie', admin)
        .attach('file', Buffer.from('#!/bin/sh\necho pwned'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(415);
    });

    it('rejects files over the size limit', async () => {
      await http()
        .post('/api/v1/admin/media')
        .set('Cookie', admin)
        .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
          filename: 'big.png',
          contentType: 'image/png',
        })
        .expect(413);
    });

    it('uploads, optimises and publicly serves an image', async () => {
      const png = await sharp({
        create: { width: 800, height: 600, channels: 3, background: '#26344f' },
      })
        .png()
        .toBuffer();
      const res = await http()
        .post('/api/v1/admin/media')
        .set('Cookie', admin)
        .field('altText', 'A navy test card')
        .attach('file', png, { filename: 'card.png', contentType: 'image/png' })
        .expect(201);
      expect(res.body).toMatchObject({
        mimeType: 'image/webp',
        width: 800,
        height: 600,
        alt: 'A navy test card',
        usageCount: 0,
      });
      imageId = res.body.id as string;

      const object = await fetch(res.body.thumbnailUrl as string);
      expect(object.status).toBe(200);
      expect(object.headers.get('content-type')).toBe('image/webp');
    });
  });

  describe('content lifecycle', () => {
    let id: string;

    it('creates a draft with a generated slug, invisible to the public', async () => {
      const res = await http()
        .post('/api/v1/admin/content')
        .set('Cookie', editor)
        .send({
          title: 'First Snow',
          body: 'line one\nline two',
          kind: 'POEM',
          status: 'DRAFT',
          coverImageId: imageId,
        })
        .expect(201);
      expect(res.body).toMatchObject({
        slug: 'first-snow',
        status: 'DRAFT',
        publishedAt: null,
        coverImage: { id: imageId },
      });
      id = res.body.id as string;
      await http().get('/api/v1/content/first-snow').expect(404);
    });

    it('publishes it and records the publication date', async () => {
      const res = await http()
        .patch(`/api/v1/admin/content/${id}`)
        .set('Cookie', editor)
        .send({ status: 'PUBLISHED' })
        .expect(200);
      expect(res.body.publishedAt).toEqual(expect.any(String));
      const pub = await http().get('/api/v1/content/first-snow').expect(200);
      expect(pub.body).toMatchObject({ title: 'First Snow', body: 'line one\nline two' });
    });

    it('generates a distinct slug for a duplicate title, and rejects an explicit duplicate', async () => {
      const dup = await http()
        .post('/api/v1/admin/content')
        .set('Cookie', editor)
        .send({ title: 'First Snow', body: 'x', kind: 'POEM', status: 'DRAFT' })
        .expect(201);
      expect(dup.body.slug).toBe('first-snow-2');
      await http()
        .post('/api/v1/admin/content')
        .set('Cookie', editor)
        .send({ title: 'Other', slug: 'first-snow', body: 'x', kind: 'POEM', status: 'DRAFT' })
        .expect(409);
    });

    it('validates payloads and references', async () => {
      await http()
        .post('/api/v1/admin/content')
        .set('Cookie', editor)
        .send({ title: '', body: '', kind: 'NOVEL', status: 'LIVE', slug: 'Bad Slug' })
        .expect(400);
      await http()
        .post('/api/v1/admin/content')
        .set('Cookie', editor)
        .send({
          title: 'x',
          body: 'x',
          kind: 'POEM',
          status: 'DRAFT',
          coverImageId: '00000000-0000-4000-8000-000000000000',
        })
        .expect(400);
      await http()
        .patch('/api/v1/admin/content/not-a-uuid')
        .set('Cookie', editor)
        .send({})
        .expect(400);
      await http()
        .patch('/api/v1/admin/content/00000000-0000-4000-8000-000000000000')
        .set('Cookie', editor)
        .send({ title: 'x' })
        .expect(404);
    });

    it('protects images that are in use from deletion', async () => {
      const res = await http()
        .delete(`/api/v1/admin/media/${imageId}`)
        .set('Cookie', admin)
        .expect(409);
      expect(res.body.message).toMatch(/in use/);
    });
  });

  describe('gallery', () => {
    it('only shows published artwork, with categories', async () => {
      await http()
        .post('/api/v1/admin/gallery')
        .set('Cookie', editor)
        .send({ title: 'Hidden sketch', imageId, altText: 'sketch' })
        .expect(201);
      await http()
        .post('/api/v1/admin/gallery')
        .set('Cookie', editor)
        .send({
          title: 'Snow poster',
          imageId,
          altText: 'A poster',
          category: 'Posters',
          isPublished: true,
        })
        .expect(201);
      const res = await http().get('/api/v1/gallery').expect(200);
      expect(res.body).toMatchObject({
        total: 1,
        categories: ['Posters'],
        items: [{ slug: 'snow-poster' }],
      });
      expect(res.body.items[0].image.alt).toBe('A poster');
      await http().get('/api/v1/gallery/hidden-sketch').expect(404);
    });

    it('filters, searches and sorts artwork for the studio, including hidden pieces', async () => {
      const list = (q: string) =>
        http().get(`/api/v1/admin/gallery${q}`).set('Cookie', editor).expect(200);

      const hidden = await list('?visibility=hidden');
      expect(hidden.body.items.map((i: { slug: string }) => i.slug)).toEqual(['hidden-sketch']);
      expect(hidden.body.total).toBe(1);

      const published = await list('?visibility=published&category=Posters');
      expect(published.body.items.map((i: { slug: string }) => i.slug)).toEqual(['snow-poster']);

      const search = await list('?search=SKETCH');
      expect(search.body.items).toHaveLength(1);

      // Touch the hidden piece so it becomes the most recently updated.
      await http()
        .patch(`/api/v1/admin/gallery/${hidden.body.items[0].id}`)
        .set('Cookie', editor)
        .send({ description: 'Edited' })
        .expect(200);
      const recent = await list('?sort=updated&pageSize=1');
      expect(recent.body.items[0].slug).toBe('hidden-sketch');
      expect(recent.body.categories).toEqual(['Posters']);

      await http().get('/api/v1/admin/gallery?visibility=draft').set('Cookie', editor).expect(400);
      await http().get('/api/v1/admin/gallery?sort=random').set('Cookie', editor).expect(400);

      // The public feed never includes hidden artwork, whatever the query.
      const pub = await http().get('/api/v1/gallery?pageSize=50').expect(200);
      expect(pub.body.items.map((i: { slug: string }) => i.slug)).not.toContain('hidden-sketch');
    });

    it('accepts only genuine Instagram post links', async () => {
      const item = await http()
        .post('/api/v1/admin/gallery')
        .set('Cookie', editor)
        .send({ title: 'Linked poster', imageId, altText: 'Poster', isPublished: true })
        .expect(201);
      for (const bad of [
        'https://evil.example/p/abc',
        'javascript:alert(1)',
        'https://instagram.com/decemberscribbles',
      ]) {
        await http()
          .patch(`/api/v1/admin/gallery/${item.body.id}`)
          .set('Cookie', editor)
          .send({ instagramUrl: bad })
          .expect(400);
      }
      const ok = await http()
        .patch(`/api/v1/admin/gallery/${item.body.id}`)
        .set('Cookie', editor)
        .send({ instagramUrl: 'https://www.instagram.com/p/AbC_123/' })
        .expect(200);
      expect(ok.body.instagramUrl).toBe('https://www.instagram.com/p/AbC_123/');
      await http()
        .delete(`/api/v1/admin/gallery/${item.body.id}`)
        .set('Cookie', editor)
        .expect(204);
    });
  });

  describe('enquiries and profile (admin only)', () => {
    it('lists enquiries and updates their status', async () => {
      const created = await http()
        .post('/api/v1/enquiries')
        .send({
          name: 'V',
          email: 'v@example.com',
          type: 'FEEDBACK',
          message: 'Lovely work, thank you.',
        })
        .expect(201);
      const list = await http()
        .get('/api/v1/admin/enquiries?status=NEW')
        .set('Cookie', admin)
        .expect(200);
      expect(list.body.items).toEqual([
        expect.objectContaining({ id: created.body.id, status: 'NEW' }),
      ]);
      const updated = await http()
        .patch(`/api/v1/admin/enquiries/${created.body.id}`)
        .set('Cookie', admin)
        .send({ status: 'ARCHIVED' })
        .expect(200);
      expect(updated.body.status).toBe('ARCHIVED');
      await http()
        .delete(`/api/v1/admin/enquiries/${created.body.id}`)
        .set('Cookie', admin)
        .expect(204);
    });

    it('updates the site profile', async () => {
      await http()
        .put('/api/v1/admin/site-profile')
        .set('Cookie', admin)
        .send({
          displayName: 'December Scribbles',
          tagline: 'New tagline',
          aboutBody: 'Hello.',
          instagramUrl: 'javascript:alert(1)',
        })
        .expect(400);
      await http()
        .put('/api/v1/admin/site-profile')
        .set('Cookie', admin)
        .send({
          displayName: 'December Scribbles',
          tagline: 'New tagline',
          aboutBody: 'Hello.',
          contactEmail: '',
        })
        .expect(200);
      const res = await http().get('/api/v1/site-profile').expect(200);
      expect(res.body).toMatchObject({
        tagline: 'New tagline',
        aboutBody: 'Hello.',
        contactEmail: null,
        aboutImage: null,
      });
    });

    it('shows an About image and protects it from deletion while in use', async () => {
      const profile = { displayName: 'December Scribbles', tagline: 't', aboutBody: '' };
      await http()
        .put('/api/v1/admin/site-profile')
        .set('Cookie', admin)
        .send({ ...profile, aboutImageId: imageId })
        .expect(200);
      const res = await http().get('/api/v1/site-profile').expect(200);
      expect(res.body.aboutImage).toMatchObject({
        id: imageId,
        url: expect.stringContaining('full.webp'),
      });
      await http().delete(`/api/v1/admin/media/${imageId}`).set('Cookie', admin).expect(409);
      await http()
        .put('/api/v1/admin/site-profile')
        .set('Cookie', admin)
        .send({ ...profile, aboutImageId: null })
        .expect(200);
    });

    it('reports dashboard statistics', async () => {
      const res = await http().get('/api/v1/admin/stats').set('Cookie', editor).expect(200);
      expect(res.body).toEqual({
        content: { published: 1, draft: 1, archived: 0 },
        gallery: { published: 1, hidden: 1 },
        enquiries: { new: 0, total: 0 },
        media: { total: 1 },
      });
    });
  });
});
