import type { LucideIcon, LucideProps } from 'lucide-react';
import clsx from 'clsx';

/*
 * The one icon wrapper used across the site and the Studio. Every icon is a Lucide outline
 * icon at a fixed stroke width and one of three sizes, so geometry and weight stay consistent.
 * Icons are decorative (aria-hidden); controls carry their own accessible names.
 */

const SIZES = { sm: 16, md: 18, lg: 22 } as const;

export function Icon({
  icon: Glyph,
  size = 'md',
  className,
  ...rest
}: { icon: LucideIcon; size?: keyof typeof SIZES } & Omit<LucideProps, 'size' | 'ref'>) {
  return (
    <Glyph
      size={SIZES[size]}
      strokeWidth={1.75}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
      className={clsx('shrink-0', className)}
      {...rest}
    />
  );
}
