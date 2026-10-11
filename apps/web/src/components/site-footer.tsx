import type { SiteProfile } from '@ds/contracts';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { NAV_LINKS } from '@/lib/site';
import { Logo, Monogram } from './brand';
import { Icon } from './icon';

export function SiteFooter({ profile }: { profile: SiteProfile }) {
  const year = new Date().getFullYear();
  const linkCls = 'link-draw text-on-dark-2 transition-colors hover:text-on-dark';

  return (
    <footer className="bg-ink-panel text-on-dark">
      <div className="container-page pt-16 pb-8 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Logo
              tone="dark"
              title={profile.displayName}
              className="h-auto w-full max-w-[34rem] text-on-dark"
            />
            <p className="mt-6 max-w-md text-lead text-on-dark-2">{profile.tagline}</p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 text-[0.9375rem] sm:grid-cols-3 lg:col-span-5 lg:pt-4"
          >
            <div>
              <h2 className="font-sans text-sm font-medium text-on-dark">Explore</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/" className={linkCls}>
                    Home
                  </Link>
                </li>
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-sans text-sm font-medium text-on-dark">Say hello</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/contact" className={linkCls}>
                    Contact
                  </Link>
                </li>
                {profile.contactEmail && (
                  <li>
                    <a href={`mailto:${profile.contactEmail}`} className={`${linkCls} break-all`}>
                      {profile.contactEmail}
                    </a>
                  </li>
                )}
                {profile.instagramUrl && (
                  <li>
                    <a
                      href={profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${linkCls} inline-flex items-center gap-1`}
                    >
                      Instagram
                      <Icon icon={ArrowUpRight} size="sm" />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h2 className="font-sans text-sm font-medium text-on-dark">Small print</h2>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/privacy" className={linkCls}>
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line-dark pt-6 text-sm text-on-dark-2">
          <p>
            © {year} {profile.displayName}. Words and artwork belong to their creator.
          </p>
          <p className="flex items-center gap-2">
            <Monogram tone="dark" className="h-5 w-5 text-on-dark" />
            {profile.instagramUrl ? COPY.instagramHandle : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
