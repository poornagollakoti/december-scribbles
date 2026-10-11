'use server';

import { updateTag } from 'next/cache';
import { adminGet, CACHE_TAGS } from '@/lib/api/server';

type Area = keyof typeof CACHE_TAGS;

/**
 * Called by admin screens after a successful change so public pages show it immediately
 * instead of after the cache window. Only signed-in admins can trigger it.
 */
export async function refreshPublicSite(areas: Area[]): Promise<void> {
  await adminGet('/auth/me'); // throws if the caller has no valid session
  for (const area of new Set(areas)) updateTag(CACHE_TAGS[area]);
}
