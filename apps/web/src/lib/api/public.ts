import 'server-only';
import type {
  ContentKind,
  ContentKindCount,
  ContentSummary,
  GalleryItem,
  GalleryListResponse,
  Paginated,
  PublishedContent,
  SiteProfile,
} from '@ds/contracts';
import { cache } from 'react';
import { CACHE_TAGS, publicGet } from './server';

/** Typed, cached reads of public API data for Server Components. */

export const getSiteProfile = cache(async (): Promise<SiteProfile> => {
  const profile = await publicGet<SiteProfile>('/site-profile', { tags: [CACHE_TAGS.profile] });
  if (!profile) throw new Error('Site profile endpoint returned 404');
  return profile;
});

export async function listWriting(params: {
  kind?: ContentKind;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<ContentSummary>> {
  const result = await publicGet<Paginated<ContentSummary>>('/content', {
    tags: [CACHE_TAGS.content],
    query: params,
  });
  if (!result) throw new Error('Content endpoint returned 404');
  return result;
}

export const getWriting = cache((slug: string): Promise<PublishedContent | null> =>
  publicGet<PublishedContent>(`/content/${encodeURIComponent(slug)}`, {
    tags: [CACHE_TAGS.content],
  }),
);

/** Published piece counts per writing type (types with no pieces are omitted). */
export const getKindCounts = cache(
  async (): Promise<ContentKindCount[]> =>
    (await publicGet<ContentKindCount[]>('/content/meta/kinds', { tags: [CACHE_TAGS.content] })) ??
    [],
);

export async function listGallery(params: {
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<GalleryListResponse> {
  const result = await publicGet<GalleryListResponse>('/gallery', {
    tags: [CACHE_TAGS.gallery],
    query: params,
  });
  if (!result) throw new Error('Gallery endpoint returned 404');
  return result;
}

export const getArtwork = cache((slug: string): Promise<GalleryItem | null> =>
  publicGet<GalleryItem>(`/gallery/${encodeURIComponent(slug)}`, { tags: [CACHE_TAGS.gallery] }),
);
