'use client';

import type { GalleryItem } from '@ds/contracts';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { paragraphs } from '@/lib/site';
import { Icon } from './icon';
import { ResponsiveImage } from './responsive-image';

/**
 * Accessible lightbox on a modal <dialog>: focus trap and Escape come from the platform;
 * ←/→ keys and horizontal swipes move between pieces; focus returns to the opener on close.
 */
export function useArtworkLightbox(items: GalleryItem[]) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);

  const open = useCallback((i: number, opener: HTMLElement) => {
    openerRef.current = opener;
    setIndex(i);
    dialogRef.current?.showModal();
  }, []);

  const lightbox = (
    <ArtworkLightbox
      dialogRef={dialogRef}
      items={items}
      index={index}
      onIndexChange={setIndex}
      onClosed={() => openerRef.current?.focus()}
    />
  );
  return { open, lightbox };
}

function ArtworkLightbox({
  dialogRef,
  items,
  index,
  onIndexChange,
  onClosed,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  items: GalleryItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClosed: () => void;
}) {
  const item = items[index];
  const count = items.length;
  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + count) % count),
    [index, count, onIndexChange],
  );
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (!dialog.open || count < 2) return;
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    dialog.addEventListener('keydown', onKey);
    dialog.addEventListener('close', onClosed);
    return () => {
      dialog.removeEventListener('keydown', onKey);
      dialog.removeEventListener('close', onClosed);
    };
  }, [dialogRef, go, count, onClosed]);

  if (!item) return null;
  const titleId = `lightbox-title-${item.id}`;
  const roundBtn =
    'icon-btn h-12 w-12 text-on-dark shadow-[inset_0_0_0_1px_var(--color-line-dark)] hover:!bg-on-dark hover:!text-ink';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="animated-dialog m-auto h-dvh max-h-none w-full max-w-none bg-ink-panel/[0.97] p-0 text-on-dark"
      onClick={(e) => {
        // Click on the backdrop area (the dialog itself, not its content) closes.
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && Math.abs(end - start) > 50 && count > 1) {
          go(end < start ? 1 : -1);
        }
        touchX.current = null;
      }}
    >
      <div className="pointer-events-none flex h-full flex-col">
        <div className="pointer-events-auto container-page flex items-center justify-between py-4">
          <span
            className="rounded-full bg-forest-2 px-3 py-1 text-sm tabular-nums"
            aria-live="polite"
          >
            {index + 1} / {count}
          </span>
          <button
            type="button"
            className={roundBtn}
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            autoFocus
          >
            <Icon icon={X} />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-24">
          <ResponsiveImage
            key={item.id}
            image={item.image}
            eager
            sizes="90vw"
            className="pointer-events-auto max-h-full w-auto rounded-[var(--radius-md)] bg-transparent object-contain shadow-[var(--shadow-lg)] motion-safe:animate-rise"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous artwork"
                className={`${roundBtn} pointer-events-auto absolute top-1/2 left-6 hidden -translate-y-1/2 sm:inline-flex`}
              >
                <Icon icon={ChevronLeft} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next artwork"
                className={`${roundBtn} pointer-events-auto absolute top-1/2 right-6 hidden -translate-y-1/2 sm:inline-flex`}
              >
                <Icon icon={ChevronRight} />
              </button>
            </>
          )}
        </div>

        <div className="pointer-events-auto container-page grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            {item.category && <p className="text-meta text-on-dark-2">{item.category}</p>}
            <h2 id={titleId} className="mt-1 text-heading">
              {item.title}
            </h2>
            {item.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-on-dark-2">
                {paragraphs(item.description)[0]}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/gallery/${item.slug}`} className="btn btn-blush btn-sm">
              Open page
              <Icon icon={ArrowUpRight} size="sm" />
            </Link>
            {item.instagramUrl && (
              <a
                href={item.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-on-dark btn-sm"
              >
                Instagram
                <Icon icon={ArrowUpRight} size="sm" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
