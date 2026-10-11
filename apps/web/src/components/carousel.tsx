'use client';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Icon } from './icon';

/**
 * Accessible, dependency-free carousel on native horizontal scrolling + scroll-snap, so
 * touch, trackpad and keyboard scrolling work natively. Previous/next move by one "page".
 * Slides are real list items with real links, reachable by Tab without the buttons.
 * The heading is passed in so it shares one row with the controls.
 */
export function Carousel({
  label,
  slides,
  slideClassName,
  header,
  align = 'start',
  tone = 'light',
}: {
  label: string;
  slides: React.ReactNode[];
  /** Width rules for each slide, e.g. "w-[82%] sm:w-[46%] lg:w-[31%]". */
  slideClassName: string;
  header: React.ReactNode;
  /** Vertical alignment of slides with different heights (`end` lines up captions). */
  align?: 'start' | 'end';
  tone?: 'light' | 'dark';
}) {
  const trackId = useId();
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
    setProgress(max > 0 ? el.scrollLeft / max : 1);
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const page = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  };

  const scrollable = !(edges.start && edges.end);
  const dark = tone === 'dark';
  const btn = clsx(
    'icon-btn h-11 w-11',
    dark
      ? 'text-on-dark shadow-[inset_0_0_0_1px_var(--color-line-dark)] hover:!bg-on-dark hover:!text-forest disabled:hover:!bg-transparent disabled:hover:!text-on-dark'
      : 'icon-btn-outline',
  );

  return (
    <section aria-roledescription="carousel" aria-label={label}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1">{header}</div>
        {scrollable && (
          <div className="flex gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => page(-1)}
              disabled={edges.start}
              aria-controls={trackId}
              aria-label="Previous slides"
            >
              <Icon icon={ChevronLeft} />
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => page(1)}
              disabled={edges.end}
              aria-controls={trackId}
              aria-label="Next slides"
            >
              <Icon icon={ChevronRight} />
            </button>
          </div>
        )}
      </div>

      <ul
        id={trackId}
        ref={trackRef}
        onScroll={update}
        tabIndex={0}
        aria-label={`${label}: use arrow keys to scroll`}
        className={clsx(
          '-mx-[var(--spacing-gutter)] mt-10 flex snap-x snap-mandatory scroll-px-[var(--spacing-gutter)] gap-4 overflow-x-auto px-[var(--spacing-gutter)] pt-1 pb-4 [scrollbar-width:none] focus-visible:outline-offset-[-2px] sm:gap-6 [&::-webkit-scrollbar]:hidden',
          align === 'end' && 'items-end',
        )}
      >
        {slides.map((slide, i) => (
          <li key={i} className={clsx('shrink-0 snap-start', slideClassName)}>
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
              className="h-full"
            >
              {slide}
            </div>
          </li>
        ))}
      </ul>

      {scrollable && (
        <div
          aria-hidden="true"
          className={clsx(
            'relative mt-4 h-[3px] overflow-hidden rounded-full',
            dark ? 'bg-line-dark' : 'bg-line',
          )}
        >
          <div
            className={clsx(
              'absolute inset-y-0 left-0 rounded-full transition-[width] duration-200',
              dark ? 'bg-blush' : 'bg-ink',
            )}
            style={{ width: `${Math.max(10, progress * 100)}%` }}
          />
        </div>
      )}
    </section>
  );
}
