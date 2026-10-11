import { connection } from 'next/server';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getProfileOrFallback } from '@/lib/profile';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Render at request time (so builds never depend on the API being reachable).
  // API responses are still cached in the data cache and revalidated on admin edits.
  await connection();
  const profile = await getProfileOrFallback();
  return (
    <>
      <SiteHeader name={profile.displayName} instagramUrl={profile.instagramUrl} />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        {children}
      </main>
      <SiteFooter profile={profile} />
    </>
  );
}
