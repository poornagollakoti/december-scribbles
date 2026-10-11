import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Monogram } from '@/components/brand';
import { Icon } from '@/components/icon';
import { ResponsiveImage } from '@/components/responsive-image';
import { Reveal } from '@/components/reveal';
import { Arrow, Container, EmptyState } from '@/components/ui';
import { COPY } from '@/lib/copy';
import { getProfileOrFallback } from '@/lib/profile';
import { paragraphs } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: 'About December Scribbles and the inspiration behind the writing.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const profile = await getProfileOrFallback();
  const [lead, ...body] = paragraphs(profile.aboutBody);
  const [first, ...rest] = profile.displayName.split(' ');

  return (
    <Container className="pb-[var(--spacing-section)]">
      <section className="grid gap-12 pt-12 pb-16 sm:pt-20 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className={profile.aboutImage ? 'lg:col-span-7' : 'lg:col-span-10'}>
          <p className="kicker motion-safe:animate-rise">{COPY.about.eyebrow}</p>
          <h1 className="mt-5 text-hero motion-safe:animate-rise [animation-delay:70ms]">
            {first} <span className="accent-serif text-rose">{rest.join(' ')}</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lead text-ink-2 motion-safe:animate-rise [animation-delay:140ms]">
            {profile.tagline}
          </p>
        </div>
        {profile.aboutImage && (
          <figure className="lg:col-span-5 motion-safe:animate-rise [animation-delay:200ms]">
            <div className="print-frame">
              <ResponsiveImage
                image={profile.aboutImage}
                eager
                sizes="(min-width: 1024px) 34vw, 92vw"
                className="block h-auto w-full"
              />
            </div>
          </figure>
        )}
      </section>

      {lead ? (
        <section className="grid gap-12 rounded-[var(--radius-xl)] bg-surface p-6 shadow-[var(--shadow-sm)] ring-1 ring-line sm:p-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <Monogram className="h-12 w-12 text-forest" />
            <p className="mt-6 font-display text-heading font-medium">{lead}</p>
          </Reveal>
          {body.length > 0 && (
            <Reveal
              className="space-y-6 text-[1.125rem] leading-[1.8] text-ink-2 lg:col-span-6 lg:col-start-7"
              delay={100}
            >
              {body.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </Reveal>
          )}
        </section>
      ) : (
        <EmptyState title="The full story is still being written." icon={BookOpen}>
          Until then, the best introduction to December Scribbles is the writing itself.
        </EmptyState>
      )}

      <section className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[var(--radius-xl)] bg-forest px-6 py-10 text-on-dark sm:flex-row sm:items-center sm:px-10">
        <p className="max-w-lg font-display text-heading">Start with the notebook.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/writing" className="btn btn-blush">
            Read the writing
            <Arrow />
          </Link>
          {profile.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-on-dark"
            >
              Instagram
              <Icon icon={ArrowUpRight} size="sm" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </section>
    </Container>
  );
}
