import { CONTENT_KIND_LABELS, type ContentLink } from '@ds/contracts';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { ResponsiveImage } from '@/components/responsive-image';
import { ShareActions } from '@/components/share-actions';
import { Arrow, Container } from '@/components/ui';
import { WritingBody } from '@/components/writing-body';
import { getWriting, listWriting } from '@/lib/api/public';
import { COPY } from '@/lib/copy';
import { getProfileOrFallback } from '@/lib/profile';
import { formatDate, SITE_URL } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getWriting((await params).slug);
  if (!item) return { title: 'Not found' };
  const description = item.excerpt ?? item.body.slice(0, 160).replace(/\s+/g, ' ');
  return {
    title: item.title,
    description,
    alternates: { canonical: `/writing/${item.slug}` },
    openGraph: {
      type: 'article',
      title: item.title,
      description,
      publishedTime: item.publishedAt ?? undefined,
      images: item.coverImage
        ? [{ url: item.coverImage.url, alt: item.coverImage.alt }]
        : undefined,
    },
  };
}

function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  return words < 120 ? 'A short read' : `${Math.max(1, Math.round(words / 220))} min read`;
}

export default async function WritingDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [item, profile] = await Promise.all([getWriting(slug), getProfileOrFallback()]);
  if (!item) notFound();
  const related = (await listWriting({ kind: item.kind, pageSize: 4 })).items
    .filter((r) => r.id !== item.id)
    .slice(0, 3);
  const date = formatDate(item.publishedAt);
  const withCover = Boolean(item.coverImage);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    headline: item.title,
    genre: CONTENT_KIND_LABELS[item.kind],
    datePublished: item.publishedAt ?? undefined,
    author: { '@type': 'Person', name: profile.displayName },
    url: `${SITE_URL}/writing/${item.slug}`,
    image: item.coverImage?.url,
  };

  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-meta text-ink-2">
      <Link
        href={`/writing?kind=${item.kind}`}
        className="rounded-full bg-blush-soft px-3 py-1 font-medium text-rose-deep transition-colors hover:bg-blush"
      >
        {CONTENT_KIND_LABELS[item.kind]}
      </Link>
      {date && <time dateTime={item.publishedAt ?? undefined}>{date}</time>}
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1.5">
        <Icon icon={Clock} size="sm" />
        {readingTime(item.body)}
      </span>
    </div>
  );

  return (
    <article>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Container className="pt-6 sm:pt-10">
        <Link href="/writing" className="btn btn-quiet btn-sm -ml-3">
          <Icon icon={ArrowLeft} size="sm" />
          All writing
        </Link>

        {withCover ? (
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <figure className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
              <div className="image-well flex justify-center p-4 sm:p-6">
                <ResponsiveImage
                  image={item.coverImage!}
                  eager
                  sizes="(min-width: 1024px) 38vw, 92vw"
                  className="h-auto max-h-[75svh] w-auto max-w-full rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]"
                />
              </div>
            </figure>
            <div className="lg:col-span-7 lg:pt-4">
              {meta}
              <h1 className="mt-5 text-display motion-safe:animate-rise">{item.title}</h1>
              <div className="mt-12 motion-safe:animate-rise [animation-delay:120ms]">
                <WritingBody kind={item.kind} body={item.body} align="start" />
              </div>
              <div className="mt-12 border-t border-line pt-6">
                <ShareActions title={item.title} path={`/writing/${item.slug}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl">
            <header className="pt-10 pb-12 text-center sm:pt-16">
              <div className="flex justify-center">{meta}</div>
              <h1 className="mt-6 text-display motion-safe:animate-rise">{item.title}</h1>
            </header>
            <div className="motion-safe:animate-rise [animation-delay:120ms]">
              <WritingBody kind={item.kind} body={item.body} />
            </div>
            <div className="mt-14 flex justify-center border-t border-line pt-6">
              <ShareActions title={item.title} path={`/writing/${item.slug}`} />
            </div>
          </div>
        )}
      </Container>

      <Container className="mt-20">
        {(item.older || item.newer) && (
          <nav aria-label="More writing" className="grid gap-4 sm:grid-cols-2">
            <AdjacentLink link={item.older} direction="older" />
            <AdjacentLink link={item.newer} direction="newer" />
          </nav>
        )}

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-20">
            <h2 id="related-title" className="text-heading">
              More {CONTENT_KIND_LABELS[item.kind].toLowerCase()}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/writing/${r.slug}`}
                    className="group flex h-full items-center gap-4 rounded-[var(--radius-lg)] bg-surface p-3 ring-1 ring-line transition-shadow hover:shadow-[var(--shadow-md)]"
                  >
                    <span className="image-well relative h-20 w-16 shrink-0">
                      {r.coverImage ? (
                        <ResponsiveImage
                          image={r.coverImage}
                          sizes="64px"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 bg-blush-soft" />
                      )}
                    </span>
                    <span className="font-display text-[1.1rem] leading-tight font-semibold tracking-[-0.015em] group-hover:text-rose">
                      {r.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <aside className="mt-20 mb-[var(--spacing-section)] flex flex-col items-start justify-between gap-6 rounded-[var(--radius-xl)] bg-forest px-6 py-10 text-on-dark sm:flex-row sm:items-center sm:px-10">
          <p className="max-w-lg font-display text-heading">{COPY.closing.title}</p>
          <Link href="/contact" className="btn btn-blush shrink-0">
            Write in
            <Arrow />
          </Link>
        </aside>
      </Container>
    </article>
  );
}

function AdjacentLink({
  link,
  direction,
}: {
  link: ContentLink | null;
  direction: 'older' | 'newer';
}) {
  if (!link) return <span className="hidden sm:block" />;
  const newer = direction === 'newer';
  return (
    <Link
      href={`/writing/${link.slug}`}
      rel={newer ? 'next' : 'prev'}
      className={`group flex min-w-0 items-center gap-4 rounded-[var(--radius-lg)] bg-surface p-5 ring-1 ring-line transition-shadow hover:shadow-[var(--shadow-md)] ${newer ? 'flex-row-reverse text-right' : ''}`}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-ink group-hover:text-canvas">
        <Icon icon={newer ? ArrowRight : ArrowLeft} size="sm" />
      </span>
      <span className="min-w-0">
        <span className="block text-meta text-ink-2">
          {newer ? 'Newer' : 'Older'} · {CONTENT_KIND_LABELS[link.kind]}
        </span>
        <span className="mt-0.5 line-clamp-2 font-display text-subheading font-semibold">
          {link.title}
        </span>
      </span>
    </Link>
  );
}
