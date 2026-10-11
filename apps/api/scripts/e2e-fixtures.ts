/**
 * Resets the TEST database to a known state for the website's Playwright tests.
 * Refuses to run against any database whose name does not end in `_test`.
 *
 *   npm run e2e:fixtures -w @ds/api
 */
import { NestFactory } from '@nestjs/core';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { GalleryService } from '../src/modules/gallery/gallery.service';
import { MediaService } from '../src/modules/media/media.service';
import { PasswordService } from '../src/modules/users/password.service';

export const E2E_ADMIN = { email: 'e2e-admin@example.com', password: 'e2e-password-not-secret' };

async function main(): Promise<void> {
  const dbName = new URL(process.env.DATABASE_URL ?? 'postgresql://x/none').pathname.slice(1);
  if (!dbName.endsWith('_test')) {
    throw new Error(`Refusing to load fixtures into non-test database "${dbName}"`);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  try {
    const prisma = app.get(PrismaService);
    await prisma.$transaction([
      prisma.session.deleteMany(),
      prisma.enquiry.deleteMany(),
      prisma.galleryItem.deleteMany(),
      prisma.content.deleteMany(),
      prisma.siteProfile.deleteMany(),
      prisma.mediaAsset.deleteMany(),
      prisma.adminUser.deleteMany(),
    ]);
    const admin = await prisma.adminUser.create({
      data: {
        email: E2E_ADMIN.email,
        name: 'E2E Admin',
        role: 'ADMIN',
        passwordHash: await new PasswordService().hash(E2E_ADMIN.password),
      },
    });
    await prisma.content.create({
      data: {
        slug: 'e2e-first-light',
        title: 'E2E First Light',
        excerpt: 'Fixture piece for end-to-end tests.',
        body: 'Fixture line one\nFixture line two\n\nFixture stanza two',
        kind: 'POEM',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Three more published pieces, so the homepage writing feed becomes a carousel.
    for (const n of [1, 2, 3]) {
      await prisma.content.create({
        data: {
          slug: `e2e-note-${n}`,
          title: `E2E Note ${n}`,
          excerpt: `Fixture note number ${n}.`,
          body: `Fixture note body ${n}.`,
          kind: 'BOOK_NOTE',
          status: 'PUBLISHED',
          publishedAt: new Date(Date.now() - n * 86_400_000),
        },
      });
    }

    // Two artworks through the real upload pipeline (S3Mock), for gallery/lightbox tests.
    const media = app.get(MediaService);
    const gallery = app.get(GalleryService);
    for (const [i, colour] of ['#26344f', '#a83f55'].entries()) {
      const png = await sharp({
        create: { width: 600, height: 750, channels: 3, background: colour },
      })
        .png()
        .toBuffer();
      const asset = await media.upload(
        { buffer: png, originalname: `e2e-${i + 1}.png` },
        `E2E poster ${i + 1}`,
        admin.id,
      );
      await gallery.create({
        title: `E2E Poster ${i + 1}`,
        imageId: asset.id,
        altText: `Plain test poster number ${i + 1}`,
        displayOrder: i,
        isPublished: true,
      });
    }
    console.log('E2E fixtures loaded.');
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
