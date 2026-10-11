'use client';

import type { GalleryItem } from '@ds/contracts';
import { Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { useArtworkLightbox } from './artwork-lightbox';
import { Icon } from './icon';
import { ResponsiveImage } from './responsive-image';

/** Plain left-clicks open the lightbox; modified clicks (new tab etc.) follow the link. */
function shouldIntercept(e: React.MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * Masonry gallery. Artwork keeps its natural proportions (never cropped); each tile is a
 * real link to the artwork's page, enhanced to open the lightbox on a plain click.
 */
export function ArtworkMasonry({ items }: { items: GalleryItem[] }) {
  const { open, lightbox } = useArtworkLightbox(items);
  return (
    <>
      <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 lg:gap-6">
        {items.map((item, i) => (
          <li key={item.id} className="mb-6 break-inside-avoid">
            <figure className="group">
              <Link
                href={`/gallery/${item.slug}`}
                aria-haspopup="dialog"
                onClick={(e) => {
                  if (!shouldIntercept(e)) return;
                  e.preventDefault();
                  open(i, e.currentTarget);
                }}
                className="relative block overflow-hidden rounded-[var(--radius-lg)] bg-muted shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
              >
                <ResponsiveImage
                  image={item.image}
                  eager={i < 3}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  className="block h-auto w-full transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink opacity-0 shadow-[var(--shadow-sm)] backdrop-blur transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                  <Icon icon={Maximize2} size="sm" />
                </span>
              </Link>
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 px-1">
                <span className="font-display text-[1.1rem] font-semibold tracking-[-0.015em]">
                  {item.title}
                </span>
                {item.category && (
                  <span className="shrink-0 text-meta text-ink-2">{item.category}</span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {lightbox}
    </>
  );
}
