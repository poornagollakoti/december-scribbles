import 'server-only';
import type { SiteProfile } from '@ds/contracts';
import { unstable_rethrow } from 'next/navigation';
import { getSiteProfile } from './api/public';

/** Confirmed brand facts (from the Instagram profile), used if the API is unreachable. */
export const FALLBACK_PROFILE: SiteProfile = {
  displayName: 'December Scribbles',
  tagline: 'Life is nothing without inspirations. And i write what inspires.',
  aboutBody: '',
  contactEmail: null,
  instagramUrl: 'https://www.instagram.com/decemberscribbles/',
  aboutImage: null,
  updatedAt: new Date(0).toISOString(),
};

/** Site chrome (header/footer/metadata) must render even if the API is briefly down. */
export async function getProfileOrFallback(): Promise<SiteProfile> {
  try {
    return await getSiteProfile();
  } catch (error) {
    unstable_rethrow(error); // let Next.js control-flow errors (dynamic rendering, redirects) through
    console.error('Falling back to default site profile:', error);
    return FALLBACK_PROFILE;
  }
}
