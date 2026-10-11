import 'server-only';
import type { AdminContent, AdminGalleryItem } from '@ds/contracts';
import { notFound } from 'next/navigation';
import { ApiRequestError } from './api/errors';
import { adminGet } from './api/server';

/** Loads one item for a Studio page; unknown or malformed ids become a 404 page. */
async function loadOr404<T>(path: string): Promise<T> {
  try {
    return await adminGet<T>(path);
  } catch (e) {
    if (e instanceof ApiRequestError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export const loadContent = (id: string) =>
  loadOr404<AdminContent>(`/admin/content/${encodeURIComponent(id)}`);

export const loadArtwork = (id: string) =>
  loadOr404<AdminGalleryItem>(`/admin/gallery/${encodeURIComponent(id)}`);
