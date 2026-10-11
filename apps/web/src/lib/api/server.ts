import 'server-only';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { toApiError } from './errors';

const API_BASE = `${(process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/+$/, '')}/api/v1`;

/** How long public API responses may be served from the Next.js data cache. */
export const PUBLIC_REVALIDATE_SECONDS = 60;

/** Cache tags, so admin edits can invalidate public pages immediately. */
export const CACHE_TAGS = {
  content: 'content',
  gallery: 'gallery',
  profile: 'site-profile',
} as const;

interface PublicFetchOptions {
  tags: string[];
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: PublicFetchOptions['query']): string {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Server Components: public, cacheable GET. Returns null on 404. */
export async function publicGet<T>(path: string, options: PublicFetchOptions): Promise<T | null> {
  // Always render at request time, so builds never depend on the API being reachable.
  await connection();
  const response = await fetch(buildUrl(path, options.query), {
    headers: { Accept: 'application/json' },
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: options.tags },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}

/**
 * Server Components / Server Actions: authenticated GET on behalf of the signed-in admin.
 * Forwards the session cookie; never cached.
 */
export async function adminGet<T>(path: string, query?: PublicFetchOptions['query']): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(buildUrl(path, query), {
    headers: { Accept: 'application/json', Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
