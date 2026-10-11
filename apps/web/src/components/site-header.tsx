import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/site';
import { Wordmark } from './brand';
import { Icon } from './icon';
import { MobileMenu } from './mobile-menu';
import { NavPills } from './nav-link';

/**
 * Sticky header with a translucent backdrop (the blur keeps it legible over imagery
 * without a heavy bar). Navigation sits in a segmented pill; contact is the one action.
 */
export function SiteHeader({ name, instagramUrl }: { name: string; instagramUrl: string | null }) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-transparent bg-canvas/80 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-canvas/70">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[var(--z-dialog)] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-canvas"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-6 sm:h-[4.5rem]">
        <Wordmark name={name} />

        <nav aria-label="Main" className="hidden md:block">
          <NavPills links={NAV_LINKS} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-quiet btn-sm"
            >
              Instagram
              <Icon icon={ArrowUpRight} size="sm" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <Link href="/contact" className="btn btn-primary btn-sm">
            Say hello
          </Link>
        </div>

        <MobileMenu name={name} links={NAV_LINKS} instagramUrl={instagramUrl} />
      </div>
    </header>
  );
}
