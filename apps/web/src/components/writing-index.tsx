import { CONTENT_KIND_LABELS, type ContentSummary } from '@ds/contracts';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/site';
import { Icon } from './icon';
import { ResponsiveImage } from './responsive-image';

/** Lead piece on the writing index: large cover beside an oversized title. */
export function WritingLead({ item }: { item: ContentSummary }) {
  const date = formatDate(item.publishedAt);
  return (
    <article className="group relative grid items-center gap-8 overflow-hidden rounded-[var(--radius-xl)] bg-surface p-4 shadow-[var(--shadow-sm)] ring-1 ring-line transition-shadow duration-300 hover:shadow-[var(--shadow-lg)] sm:p-6 md:grid-cols-12 md:gap-10">
      <div className="image-well relative aspect-[4/5] md:col-span-5 md:aspect-auto md:h-[min(34rem,60svh)]">
        {item.coverImage ? (
          <ResponsiveImage
            image={item.coverImage}
            eager
            sizes="(min-width: 768px) 38vw, 92vw"
            className="absolute inset-0 h-full w-full bg-transparent object-contain p-6 transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full flex-col justify-between bg-forest p-8 text-on-dark sm:p-10">
            <span className="text-meta text-on-dark-2">{CONTENT_KIND_LABELS[item.kind]}</span>
            <p className="font-serif text-[clamp(2rem,1.4rem+2vw,3.2rem)] leading-[1.08] text-blush italic">
              {item.excerpt ?? item.title}
            </p>
          </div>
        )}
      </div>
      <div className="px-2 pb-4 md:col-span-7 md:pr-6 md:pb-0">
        <p className="flex flex-wrap items-center gap-2 text-meta text-ink-2">
          <span className="rounded-full bg-blush-soft px-3 py-1 font-medium text-rose-deep">
            Latest · {CONTENT_KIND_LABELS[item.kind]}
          </span>
          {date && <time dateTime={item.publishedAt ?? undefined}>{date}</time>}
        </p>
        <h2 className="mt-5 text-display">
          <Link href={`/writing/${item.slug}`} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h2>
        {item.excerpt && <p className="mt-5 max-w-lg text-lead text-ink-2">{item.excerpt}</p>}
        <span className="btn btn-primary mt-8" aria-hidden="true">
          Read the piece
          <Icon icon={ArrowUpRight} size="sm" className="btn-arrow" />
        </span>
      </div>
    </article>
  );
}

/**
 * Editorial index row: large title, type chip, date and (when present) a cover thumbnail.
 * The whole row is one link with the title as its name.
 */
export function WritingRow({ item }: { item: ContentSummary; index?: number }) {
  const date = formatDate(item.publishedAt);
  return (
    <li>
      <Link
        href={`/writing/${item.slug}`}
        className="group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-3 rounded-[var(--radius-lg)] px-3 py-5 transition-colors hover:bg-surface sm:grid-cols-[1fr_auto_auto] sm:px-5 sm:py-6"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-meta text-ink-2">
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-ink">
              {CONTENT_KIND_LABELS[item.kind]}
            </span>
            {date && <time dateTime={item.publishedAt ?? undefined}>{date}</time>}
          </span>
          <span className="mt-3 block font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.4rem)] leading-[1.05] font-semibold tracking-[-0.03em] transition-colors group-hover:text-rose">
            {item.title}
          </span>
          {item.excerpt && (
            <span className="mt-2 line-clamp-2 block max-w-[var(--container-measure)] text-ink-2">
              {item.excerpt}
            </span>
          )}
        </span>
        {item.coverImage ? (
          <span className="image-well relative h-24 w-20 shrink-0 sm:h-28 sm:w-24">
            <ResponsiveImage
              image={item.coverImage}
              sizes="96px"
              className="absolute inset-0 h-full w-full bg-transparent object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </span>
        ) : (
          <span className="hidden sm:block" />
        )}
        <span className="hidden h-11 w-11 items-center justify-center rounded-full ring-1 ring-line-strong transition-all duration-300 group-hover:bg-ink group-hover:text-canvas group-hover:ring-ink sm:inline-flex">
          <Icon icon={ArrowUpRight} size="sm" />
        </span>
      </Link>
    </li>
  );
}
