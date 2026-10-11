import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { ResponsiveImage } from '@/components/responsive-image';
import { ShareActions } from '@/components/share-actions';
import { getArtwork } from '@/lib/api/public';
import { paragraphs } from '@/lib/site';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getArtwork((await params).slug);
  if (!item) return { title: 'Not found' };
  const description =
    item.description?.slice(0, 160) ?? `${item.title}, artwork by December Scribbles.`;
  return {
    title: item.title,
    description,
    alternates: { canonical: `/gallery/${item.slug}` },
    openGraph: {
      title: item.title,
      description,
      images: [{ url: item.image.url, alt: item.image.alt }],
    },
  };
}

/** A viewing room: the artwork at full proportion on the brand's forest green. */
export default async function ArtworkPage({ params }: { params: Params }) {
  const item = await getArtwork((await params).slug);
  if (!item) notFound();

  return (
    <div className="container-page pt-2 pb-[var(--spacing-section)] sm:pt-4">
      <div className="overflow-hidden rounded-[var(--radius-xl)] bg-forest text-on-dark">
        <div className="grid gap-10 p-5 sm:p-10 lg:grid-cols-12 lg:gap-12 lg:p-14">
          <figure className="flex items-center justify-center lg:col-span-7 motion-safe:animate-rise">
            <ResponsiveImage
              image={item.image}
              eager
              sizes="(min-width: 1024px) 55vw, 92vw"
              className="h-auto max-h-[80svh] w-auto max-w-full rounded-[var(--radius-md)] bg-transparent shadow-[var(--shadow-lg)]"
            />
          </figure>

          <div className="flex flex-col lg:col-span-5 lg:py-4 motion-safe:animate-rise [animation-delay:120ms]">
            <Link
              href="/gallery"
              className="btn btn-sm -ml-3 self-start text-on-dark-2 hover:bg-forest-2 hover:text-on-dark"
            >
              <Icon icon={ArrowLeft} size="sm" />
              The sketchbook
            </Link>
            {item.category && (
              <p className="mt-8 self-start rounded-full bg-forest-2 px-3 py-1 text-meta text-on-dark-2">
                {item.category}
              </p>
            )}
            <h1 className="mt-4 text-display">{item.title}</h1>
            {item.description &&
              paragraphs(item.description).map((p, i) => (
                <p key={i} className="mt-5 text-lead whitespace-pre-line text-on-dark-2">
                  {p}
                </p>
              ))}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
              {item.instagramUrl && (
                <a
                  href={item.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-blush"
                >
                  View on Instagram
                  <Icon icon={ArrowUpRight} size="sm" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
              <div className="rounded-full bg-surface p-1">
                <ShareActions title={item.title} path={`/gallery/${item.slug}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
