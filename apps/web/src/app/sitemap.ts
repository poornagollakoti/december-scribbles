import type { ContentSummary, GalleryItem } from '@ds/contracts';
import type { MetadataRoute } from 'next';
import { unstable_rethrow } from 'next/navigation';
import { connection } from 'next/server';
import { listGallery, listWriting } from '@/lib/api/public';
import { SITE_URL } from '@/lib/site';

const MAX_PAGES = 20;

async function all<T>(fetchPage: (page: number) => Promise<{ items: T[]; totalPages: number }>) {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await fetchPage(page);
    items.push(...result.items);
    if (page >= result.totalPages) break;
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/writing',
    '/gallery',
    '/about',
    '/contact',
    '/privacy',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  let writing: ContentSummary[] = [];
  let gallery: GalleryItem[] = [];
  try {
    [writing, gallery] = await Promise.all([
      all((page) => listWriting({ page, pageSize: 50 })),
      all((page) => listGallery({ page, pageSize: 50 })),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    console.error('Sitemap: could not load dynamic entries', error);
  }

  return [
    ...staticPages,
    ...writing.map((w) => ({
      url: `${SITE_URL}/writing/${w.slug}`,
      lastModified: w.publishedAt ?? undefined,
      priority: 0.6,
      ...(w.coverImage ? { images: [w.coverImage.url] } : {}),
    })),
    ...gallery.map((g) => ({
      url: `${SITE_URL}/gallery/${g.slug}`,
      priority: 0.5,
      images: [g.image.url],
    })),
  ];
}
