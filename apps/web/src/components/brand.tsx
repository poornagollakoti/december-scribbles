import clsx from 'clsx';
import Link from 'next/link';
import { LOGO_ART } from './logo-art';

/*
 * December Scribbles logo system. One source of geometry (logo-art.ts, generated alongside the
 * SVG files in public/brand) rendered inline so it follows the theme:
 *   ink    = currentColor (forest on light, canvas on dark)
 *   accent = rose on light, blush on dark
 * Never stretch, recolour or re-letter these; size them by height only.
 */

type Tone = 'light' | 'dark';
const ACCENT: Record<Tone, string> = {
  light: 'var(--color-rose)',
  dark: 'var(--color-blush)',
};

function MarkPaths({ tone }: { tone: Tone }) {
  const m = LOGO_ART.monogram;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={m.d} stroke="currentColor" strokeWidth={m.dWidth} />
      <path d={m.s} stroke={ACCENT[tone]} strokeWidth={m.sWidth} transform={m.sTransform} />
    </g>
  );
}

/** Standalone DS monogram: a notebook-page "D" with a handwritten "S" (umbrella-handle tail). */
export function Monogram({
  className = 'h-8 w-8',
  tone = 'light',
}: {
  className?: string;
  tone?: Tone;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <MarkPaths tone={tone} />
    </svg>
  );
}

/**
 * Full logo. `primary` is the one-line lockup with the scribble underline; `compact` stacks the
 * name beside the monogram for narrow spaces. Height drives size; width follows the ratio.
 */
export function Logo({
  variant = 'primary',
  tone = 'light',
  className,
  title = 'December Scribbles',
}: {
  variant?: 'primary' | 'compact';
  tone?: Tone;
  className?: string;
  /** Accessible name; pass `null` when a parent link already names it. */
  title?: string | null;
}) {
  const art = variant === 'primary' ? LOGO_ART.primary : LOGO_ART.compact;
  const [mx, my, ms] = art.mark;
  const [cx, cy, cr] = art.dot;
  return (
    <svg
      viewBox={art.viewBox}
      className={clsx('block w-auto shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g transform={`translate(${mx} ${my}) scale(${ms})`}>
        <MarkPaths tone={tone} />
      </g>
      <path d={art.december} fill="currentColor" />
      <path d={art.scribbles} fill="currentColor" />
      <circle cx={cx} cy={cy} r={cr} fill={ACCENT[tone]} />
      {'underline' in art && (
        <path
          d={art.underline}
          fill="none"
          stroke={ACCENT[tone]}
          strokeWidth={art.underlineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Home link used in headers and menus: primary lockup, compact below `sm` if requested. */
export function Wordmark({
  name,
  className,
  tone = 'light',
  responsive = true,
}: {
  name: string;
  className?: string;
  tone?: Tone;
  /** Swap to the compact lockup on narrow screens. */
  responsive?: boolean;
}) {
  return (
    <Link
      href="/"
      className={clsx(
        'group inline-flex items-center rounded-[var(--radius-xs)]',
        tone === 'light' ? 'text-forest' : 'text-on-dark',
        className,
      )}
      aria-label={`${name}, home`}
    >
      <Logo
        tone={tone}
        title={null}
        className={clsx('h-9 lg:h-11', responsive && 'hidden min-[380px]:block')}
      />
      {responsive && (
        <Logo variant="compact" tone={tone} title={null} className="h-10 min-[380px]:hidden" />
      )}
    </Link>
  );
}
