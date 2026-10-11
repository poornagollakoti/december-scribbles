/** Canonical public URL of the website, without trailing slash. */
export const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** Primary navigation. Contact is the header's call to action rather than a nav item. */
export const NAV_LINKS = [
  { href: '/writing', label: 'Writing' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
] as const;

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** Splits plain text into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Parses a positive page number from a search param; defaults to 1. */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

/**
 * Splits a tagline into a headline (first sentence) and an aside (the rest), e.g.
 * "Life is nothing without inspirations. And i write what inspires." →
 * ["Life is nothing without inspirations.", "And i write what inspires."]
 */
export function splitTagline(tagline: string): { headline: string; aside: string | null } {
  const match = tagline.trim().match(/^(.+?[.!?])\s+(.+)$/s);
  return match
    ? { headline: match[1], aside: match[2] }
    : { headline: tagline.trim(), aside: null };
}

/** Two-digit index for editorial numbering: 1 → "01". */
export function indexLabel(n: number): string {
  return String(n).padStart(2, '0');
}
