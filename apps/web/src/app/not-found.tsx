import { connection } from 'next/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getProfileOrFallback } from '@/lib/profile';
import SiteNotFound from './(site)/not-found';

/** Unmatched URLs render outside the (site) layout, so add the site chrome here. */
export default async function RootNotFound() {
  await connection(); // render per request, never at build time (the API may be unreachable then)
  const profile = await getProfileOrFallback();
  return (
    <>
      <SiteHeader name={profile.displayName} instagramUrl={profile.instagramUrl} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <SiteNotFound />
      </main>
      <SiteFooter profile={profile} />
    </>
  );
}
