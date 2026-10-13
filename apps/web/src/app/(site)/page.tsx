import { CONTENT_KIND_LABELS, type ContentKindCount, type SiteProfile } from '@ds/contracts';
import { ArrowUpRight, BookOpen, Images } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArtworkFeed, WritingFeed } from '@/components/home-feeds';
import { HomeHero } from '@/components/home-hero';
import { Icon } from '@/components/icon';
import { ResponsiveImage } from '@/components/responsive-image';
import { Reveal } from '@/components/reveal';
import { Arrow, EmptyState, MoreLink, SectionHeading } from '@/components/ui';
import { getKindCounts, listGallery, listWriting } from '@/lib/api/public';
import { COPY } from '@/lib/copy';
import { getProfileOrFallback } from '@/lib/profile';
import { brandLd, jsonLdHtml, websiteLd } from '@/lib/seo';
import { paragraphs } from '@/lib/site';

export const metadata: Metadata = {
  // The brand name first, then what visitors will find: what people search for.
  title: { absolute: 'December Scribbles · Poems, Quotes & Illustrated Posters' },
  alternates: { canonical: '/' },
};

/** How many recent items each homepage feed shows. */
const FEED_SIZE = 9;

/**
 * Homepage content architecture: each content type has exactly ONE discovery section,
 * fed by ONE request; no other section renders those items.
 *   hero         → brand statement + brand illustration (never a post)
 *   writing      → "Latest from the notebook"
 *   artwork      → "From the sketchbook"
 */
export default async function HomePage() {
  const [profile, writing, gallery, kinds] = await Promise.all([
    getProfileOrFallback(),
    listWriting({ pageSize: FEED_SIZE }),
    listGallery({ pageSize: FEED_SIZE }),
    getKindCounts(),
  ]);

  const writingItems = writing.items;
  const artworkItems = gallery.items;

  const notebookHeader = (
    <SectionHeading
      id="notebook-title"
      eyebrow={COPY.featured.eyebrow}
      title={COPY.featured.title}
      action={<MoreLink href="/writing">{COPY.featured.all}</MoreLink>}
    />
  );
  const sketchbookHeader = (
    <SectionHeading
      id="sketchbook-title"
      tone="dark"
      eyebrow={COPY.gallery.eyebrow}
      title={COPY.gallery.title}
      action={
        <Link href="/gallery" className="btn btn-on-dark btn-sm">
          {COPY.gallery.all}
          <Arrow />
        </Link>
      }
    />
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdHtml(brandLd(profile), websiteLd(profile))}
      />
      <HomeHero profile={profile} />
      <IntroSection profile={profile} kinds={kinds} />

      <section
        aria-labelledby="notebook-title"
        className="container-page pb-[var(--spacing-section)]"
      >
        {writingItems.length ? (
          <WritingFeed items={writingItems} header={notebookHeader} />
        ) : (
          <>
            {notebookHeader}
            <div className="mt-10">
              <EmptyState title={COPY.empty.writing.title} icon={BookOpen}>
                {COPY.empty.writing.body}
              </EmptyState>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="sketchbook-title" className="bg-forest text-on-dark">
        <div className="container-page section-y">
          {artworkItems.length ? (
            <ArtworkFeed items={artworkItems} header={sketchbookHeader} />
          ) : (
            <>
              {sketchbookHeader}
              <p className="mt-8 inline-flex items-center gap-3 rounded-full bg-forest-2 px-5 py-3 text-on-dark-2">
                <Icon icon={Images} size="sm" />
                {COPY.empty.gallery.body}
              </p>
            </>
          )}
        </div>
      </section>

      {(profile.aboutBody || profile.aboutImage) && <AboutSection profile={profile} />}
      <ClosingSection profile={profile} />
    </>
  );
}

/** Brand introduction + an index of writing by type (navigation, not items). */
function IntroSection({ profile, kinds }: { profile: SiteProfile; kinds: ContentKindCount[] }) {
  const statement = paragraphs(profile.aboutBody)[0] ?? COPY.intro.fallback;
  return (
    <section aria-labelledby="intro-title" className="container-page section-y">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-7">
          <p className="kicker">{COPY.intro.eyebrow}</p>
          <h2 id="intro-title" className="sr-only">
            About {profile.displayName}
          </h2>
          <p className="mt-5 font-display text-title font-medium">{statement}</p>
        </Reveal>

        {kinds.length > 0 && (
          <Reveal className="lg:col-span-4 lg:col-start-9 lg:self-end" delay={120}>
            <h3 className="font-sans text-sm font-medium text-ink-2">{COPY.intro.indexTitle}</h3>
            <ul className="mt-3 space-y-1">
              {kinds.map(({ kind, count }) => (
                <li key={kind}>
                  <Link
                    href={`/writing?kind=${kind}`}
                    className="group flex min-h-14 items-center gap-4 rounded-[var(--radius-md)] px-4 transition-colors hover:bg-surface hover:shadow-[var(--shadow-sm)]"
                  >
                    <span className="flex-1 font-display text-[1.35rem] font-semibold tracking-[-0.02em]">
                      {CONTENT_KIND_LABELS[kind]}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-ink-2 tabular-nums">
                      {count}
                    </span>
                    <Icon
                      icon={ArrowUpRight}
                      size="sm"
                      className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function AboutSection({ profile }: { profile: SiteProfile }) {
  // The first paragraph already opens the page (IntroSection), so lead with the second.
  const about = paragraphs(profile.aboutBody);
  const lead = about[1] ?? about[0];
  return (
    <section aria-labelledby="about-title" className="container-page section-y">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        {profile.aboutImage && (
          <Reveal className="lg:col-span-5">
            <div className="print-frame">
              <ResponsiveImage
                image={profile.aboutImage}
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </Reveal>
        )}
        <Reveal
          className={profile.aboutImage ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-8'}
          delay={100}
        >
          <p className="kicker">{COPY.about.eyebrow}</p>
          <h2 id="about-title" className="mt-4 text-title">
            About {profile.displayName}
          </h2>
          {lead && <p className="mt-6 max-w-xl text-lead text-ink-2">{lead}</p>}
          <div className="mt-8">
            <MoreLink href="/about">{COPY.about.cta}</MoreLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** One closing invitation: write in, or follow along on Instagram. */
function ClosingSection({ profile }: { profile: SiteProfile }) {
  return (
    <section aria-labelledby="closing-title" className="container-page section-y">
      <Reveal className="relative overflow-hidden rounded-[var(--radius-xl)] bg-blush-soft px-6 py-14 sm:px-14 sm:py-20">
        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h2 id="closing-title" className="text-display">
              Something here <span className="accent-serif text-rose">stayed</span> with you?
            </h2>
            <p className="mt-6 max-w-xl text-lead text-ink-2">{COPY.closing.body}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <Link href="/contact" className="btn btn-primary">
              Write in
              <Arrow />
            </Link>
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                {COPY.instagramHandle}
                <Icon icon={ArrowUpRight} size="sm" />
                <span className="sr-only"> on Instagram (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
