import type { SiteProfile } from '@ds/contracts';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { COPY } from '@/lib/copy';
import { splitTagline } from '@/lib/site';
import { Monogram } from './brand';
import { Icon } from './icon';
import { Arrow } from './ui';

/**
 * Immersive hero: an inset forest-green panel pairing the brand's bio line with the brand
 * illustration. It never shows posts: writing and artwork live only in their own sections.
 */
export function HomeHero({ profile }: { profile: SiteProfile }) {
  const { headline, aside } = splitTagline(profile.tagline);
  const words = headline.replace(/[.!?]$/, '').split(' ');
  const lastWord = words.pop();

  return (
    <section aria-labelledby="hero-title" className="container-page pt-2 sm:pt-4">
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-forest text-on-dark">
        {/* Soft blush glow behind the illustration for depth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/4 -right-1/4 h-[80%] w-[70%] rounded-full bg-blush/15 blur-3xl"
        />
        <div className="relative grid gap-10 px-6 py-12 sm:px-12 sm:py-16 lg:min-h-[min(46rem,calc(100svh-7rem))] lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-16">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-forest-2 px-3.5 py-1.5 text-[0.8125rem] font-medium text-on-dark-2 motion-safe:animate-rise">
              <Monogram tone="dark" className="h-5 w-5 text-on-dark" />
              {COPY.hero.meta}
            </p>
            <h1
              id="hero-title"
              className="mt-7 text-hero motion-safe:animate-rise [animation-delay:80ms]"
            >
              {words.join(' ')}{' '}
              <span className="accent-serif whitespace-nowrap text-blush">{lastWord}</span>.
            </h1>
            {aside && (
              <p className="mt-6 max-w-xl text-lead text-on-dark-2 motion-safe:animate-rise [animation-delay:160ms]">
                {aside}
              </p>
            )}
            <div className="mt-10 flex flex-wrap items-center gap-3 motion-safe:animate-rise [animation-delay:240ms]">
              <Link href="/writing" className="btn btn-blush">
                {COPY.hero.primaryCta}
                <Arrow />
              </Link>
              {profile.instagramUrl && (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-on-dark"
                >
                  {COPY.hero.secondaryCta}
                  <Icon icon={ArrowUpRight} size="sm" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>
          </div>

          <div className="relative motion-safe:animate-rise [animation-delay:200ms] lg:col-span-5">
            {/* Brand illustration (decorative): the notebook, the umbrella poster, a pencil, December snow. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG brand art */}
            <img
              src="/brand/hero-illustration.svg"
              alt=""
              width={520}
              height={600}
              fetchPriority="high"
              className="mx-auto h-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-[30rem]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
