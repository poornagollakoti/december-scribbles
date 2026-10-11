/**
 * DEVELOPMENT ONLY — loads clearly labelled SAMPLE content so layouts can be reviewed with
 * realistic volume and variety before the owner's real content exists.
 *
 *   npm run preview:load -w @ds/api      # add samples (idempotent)
 *   npm run preview:remove -w @ds/api    # delete every sample, leaving real content untouched
 *
 * Every sample is marked: titles start with "Sample:", slugs with "sample-", generated
 * posters carry the word SAMPLE, and media file names start with "sample-". Never run
 * against production.
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { ContentKind } from '@ds/contracts';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { ContentService } from '../src/modules/content/content.service';
import { GalleryService } from '../src/modules/gallery/gallery.service';
import { MediaService } from '../src/modules/media/media.service';

const PREFIX = 'sample-';

const WRITING: { title: string; kind: ContentKind; excerpt: string; body: string }[] = [
  {
    title: 'Sample: Slow mornings',
    kind: 'POEM',
    excerpt: 'Placeholder poem used to preview the layout.',
    body: 'The kettle hums its small grey tune,\nthe window holds a borrowed moon.\n\nI write the day before it starts,\nin pencil, in the quiet parts.',
  },
  {
    title: 'Sample: Notice the small things',
    kind: 'QUOTE',
    excerpt: 'Notice the small things; they are the ones that stay.',
    body: 'Notice the small things;\nthey are the ones that stay.',
  },
  {
    title: 'Sample: A walk after rain',
    kind: 'PROSE',
    excerpt: 'Placeholder prose used to preview paragraph typesetting and the drop cap.',
    body: 'The street was still shining when I stepped out, every puddle a small mirror of the sky. This is placeholder prose, written only to preview how longer paragraphs sit on the page.\n\nA second paragraph shows the rhythm between blocks of text, and how the measure keeps lines comfortable to read on both phones and wide screens.',
  },
  {
    title: 'Sample: Notes on a borrowed novel',
    kind: 'BOOK_NOTE',
    excerpt: "Placeholder reading note for Bookworm's Closet.",
    body: "Placeholder book note. In the real notebook this space holds thoughts on a book that stayed with the writer.\n\nIt previews how Bookworm's Closet entries read.",
  },
  {
    title: 'Sample: December, again',
    kind: 'POEM',
    excerpt: 'A second placeholder poem, so the index has variety.',
    body: 'Cold hands, warm tea,\na sky the colour of paper.\n\nEvery year I promise\nto write it down sooner.',
  },
  {
    title: 'Sample: Umbrella weather',
    kind: 'POEM',
    excerpt: 'A third placeholder poem.',
    body: 'Not every grey day\nneeds to be fixed.\n\nSome just need\nan umbrella and a walk.',
  },
];

const POSTERS: {
  title: string;
  category: string;
  bg: string;
  ink: string;
  w: number;
  h: number;
}[] = [
  {
    title: 'Sample: Slow down to observe',
    category: 'Posters',
    bg: '#e9dcc6',
    ink: '#1b1a17',
    w: 1080,
    h: 1350,
  },
  {
    title: 'Sample: Night sky doodle',
    category: 'Doodles',
    bg: '#1e2a3d',
    ink: '#e9e4da',
    w: 1080,
    h: 1080,
  },
  {
    title: 'Sample: Umbrella study',
    category: 'Posters',
    bg: '#a8323e',
    ink: '#fbf8f2',
    w: 1080,
    h: 1350,
  },
  {
    title: 'Sample: Reading corner',
    category: 'Cartoons',
    bg: '#cfd8c4',
    ink: '#1b1a17',
    w: 1080,
    h: 1080,
  },
  {
    title: 'Sample: Small things',
    category: 'Posters',
    bg: '#f3eee4',
    ink: '#a8323e',
    w: 1080,
    h: 1350,
  },
  {
    title: 'Sample: Rain on paper',
    category: 'Doodles',
    bg: '#dce3ec',
    ink: '#1e2a3d',
    w: 1080,
    h: 1350,
  },
];

/** A simple generated poster that is unmistakably a placeholder. */
function posterSvg(p: (typeof POSTERS)[number], i: number): Buffer {
  const label = p.title.replace('Sample: ', '');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}">
  <rect width="100%" height="100%" fill="${p.bg}"/>
  <g fill="none" stroke="${p.ink}" stroke-width="6" stroke-linecap="round" opacity="0.85">
    <path d="M${120 + i * 20} ${p.h * 0.62} q 160 -140 320 0 t 320 0 t 220 -40"/>
    <circle cx="${p.w * 0.72}" cy="${p.h * 0.28}" r="${90 + i * 8}"/>
    <path d="M${p.w * 0.3} ${p.h * 0.2} l 40 90 l 40 -90"/>
  </g>
  <text x="80" y="${p.h - 220}" font-family="Georgia, serif" font-size="78" fill="${p.ink}">${label}</text>
  <text x="80" y="${p.h - 110}" font-family="Arial, sans-serif" font-size="40" letter-spacing="12" fill="${p.ink}" opacity="0.8">SAMPLE ARTWORK</text>
</svg>`);
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  if (mode !== 'load' && mode !== 'remove')
    throw new Error('Usage: preview-content.ts load|remove');
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to run in production');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  try {
    const prisma = app.get(PrismaService);
    const media = app.get(MediaService);
    const content = app.get(ContentService);
    const gallery = app.get(GalleryService);
    const admin = await prisma.adminUser.findFirst({ orderBy: { createdAt: 'asc' } });

    // Always start from a clean slate of samples (only rows marked as samples are touched).
    await prisma.content.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.galleryItem.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    const oldMedia = await prisma.mediaAsset.findMany({
      where: { originalName: { startsWith: PREFIX } },
      select: { id: true },
    });
    for (const m of oldMedia) await media.remove(m.id);
    if (mode === 'remove') {
      console.log(`Removed sample content (${oldMedia.length} sample images).`);
      return;
    }
    if (!admin) throw new Error('Create an admin first (npm run admin:create) to own uploads.');

    const now = Date.now();
    for (const [i, w] of WRITING.entries()) {
      const created = await content.create({
        title: w.title,
        slug: `${PREFIX}${w.title
          .replace('Sample: ', '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`,
        kind: w.kind,
        status: 'PUBLISHED',
        excerpt: w.excerpt,
        body: w.body,
      });
      // Spread publication dates so ordering and neighbours look realistic.
      await prisma.content.update({
        where: { id: created.id },
        data: { publishedAt: new Date(now - i * 3 * 86_400_000) },
      });
    }

    for (const [i, p] of POSTERS.entries()) {
      const png = await sharp(posterSvg(p, i)).png().toBuffer();
      const asset = await media.upload(
        { buffer: png, originalname: `${PREFIX}poster-${i + 1}.png` },
        `Sample placeholder poster titled ${p.title.replace('Sample: ', '')}`,
        admin.id,
      );
      await gallery.create({
        title: p.title,
        slug: `${PREFIX}${p.title
          .replace('Sample: ', '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')}`,
        category: p.category,
        description: 'Placeholder artwork generated to preview the gallery layout.',
        imageId: asset.id,
        altText: asset.alt,
        displayOrder: i,
        isPublished: true,
      });
    }
    console.log(`Loaded ${WRITING.length} sample pieces and ${POSTERS.length} sample posters.`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
