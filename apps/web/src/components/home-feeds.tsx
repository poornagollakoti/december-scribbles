import { CONTENT_KIND_LABELS, type ContentSummary, type GalleryItem } from '@ds/contracts';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/site';
import { Carousel } from './carousel';
import { Icon } from './icon';
import { ResponsiveImage } from './responsive-image';

/*
 * The homepage's two discovery feeds. Each content type appears in exactly one of them;
 * no other homepage section renders writing or artwork items (the hero's featured piece
 * is excluded from these feeds by the page).
 */

/** Below this count a carousel adds nothing, so items are laid out statically. */
const CAROUSEL_MIN = 3;

export function WritingFeed({
  items,
  header,
}: {
  items: ContentSummary[];
  header: React.ReactNode;
}) {
  const cards = items.map((item, i) => <WritingCard key={item.id} item={item} eager={i < 2} />);
  if (items.length < CAROUSEL_MIN) {
    return (
      <>
        {header}
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <li key={i}>{card}</li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <Carousel
      label="Latest from the notebook"
      header={header}
      slides={cards}
      slideClassName="w-[80%] sm:w-[45%] lg:w-[30.5%]"
    />
  );
}

function WritingCard({ item, eager }: { item: ContentSummary; eager: boolean }) {
  const date = formatDate(item.publishedAt);
  return (
    <article className="group relative flex h-full flex-col">
      <div className="image-well relative aspect-[4/5] transition-shadow duration-300 group-hover:shadow-[var(--shadow-lg)]">
        {item.coverImage ? (
          <ResponsiveImage
            image={item.coverImage}
            eager={eager}
            sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 80vw"
            className="absolute inset-0 h-full w-full bg-transparent object-contain p-5 transition-transform duration-500 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
          />
        ) : (
          <TypographicCover item={item} />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-[0.8125rem] font-medium text-ink shadow-[var(--shadow-sm)] backdrop-blur">
          {CONTENT_KIND_LABELS[item.kind]}
        </span>
      </div>
      <div className="flex flex-1 items-start justify-between gap-4 pt-5">
        <div className="min-w-0">
          <h3 className="text-subheading">
            <Link
              href={`/writing/${item.slug}`}
              className="after:absolute after:inset-0 after:rounded-[var(--radius-lg)]"
            >
              {item.title}
            </Link>
          </h3>
          {date && (
            <p className="mt-1.5 text-meta text-ink-2">
              <time dateTime={item.publishedAt ?? undefined}>{date}</time>
            </p>
          )}
        </div>
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-all duration-300 group-hover:bg-ink group-hover:text-canvas">
          <Icon icon={ArrowUpRight} size="sm" />
        </span>
      </div>
    </article>
  );
}

/** Stand-in for a missing cover: the opening words, set large on a tinted page. */
function TypographicCover({ item }: { item: ContentSummary }) {
  const text = item.excerpt ?? item.title;
  return (
    <div className="flex h-full flex-col justify-end bg-blush-soft p-6 pt-14 sm:p-8">
      <p className="line-clamp-6 font-serif text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-[1.2] text-ink italic">
        {item.kind === 'QUOTE' ? `“${text}”` : text}
      </p>
    </div>
  );
}

export function ArtworkFeed({ items, header }: { items: GalleryItem[]; header: React.ReactNode }) {
  const slides = items.map((item, i) => <ArtworkSlide key={item.id} item={item} eager={i < 2} />);
  if (items.length < CAROUSEL_MIN) {
    return (
      <>
        {header}
        <ul className="mt-10 flex flex-wrap items-end gap-6">
          {slides.map((slide, i) => (
            <li key={i}>{slide}</li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <Carousel
      label="From the sketchbook"
      header={header}
      slides={slides}
      slideClassName=""
      align="end"
      tone="dark"
    />
  );
}

/**
 * Artwork at a shared height with its natural width, so every piece keeps its full
 * composition (handwritten words often run to the edges). Capped on narrow screens.
 */
function ArtworkSlide({ item, eager }: { item: GalleryItem; eager: boolean }) {
  const ratio = item.image.width / item.image.height;
  return (
    <figure
      className="group [--art-h:clamp(20rem,13rem+18vw,32rem)]"
      style={{ width: `min(calc(var(--art-h) * ${ratio.toFixed(4)}), 82vw)` }}
    >
      <Link
        href={`/gallery/${item.slug}`}
        className="block overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] ring-1 ring-line-dark transition-transform duration-500 ease-[var(--ease-soft)] group-hover:-translate-y-1.5"
      >
        <ResponsiveImage
          image={item.image}
          eager={eager}
          sizes="(min-width: 1024px) 30vw, 82vw"
          className="block h-auto w-full transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
        />
      </Link>
      <figcaption className="mt-4 flex items-baseline justify-between gap-3 text-on-dark">
        <span className="font-display text-[1.15rem] font-semibold tracking-[-0.015em]">
          {item.title}
        </span>
        {item.category && (
          <span className="shrink-0 text-meta text-on-dark-2">{item.category}</span>
        )}
      </figcaption>
    </figure>
  );
}
