import type { ImageRef } from '@ds/contracts';
import clsx from 'clsx';

const THUMB_MAX = 640; // matches the API's thumbnail rendition

/**
 * Serves the API's two pre-optimised WebP renditions (≤640px thumbnail, ≤2400px full) via
 * srcset, so the browser downloads the smaller one wherever it is enough. Width and height
 * are always set to reserve space and avoid layout shift.
 */
export function ResponsiveImage({
  image,
  sizes,
  eager = false,
  className,
  style,
}: {
  image: ImageRef;
  sizes: string;
  eager?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const thumbWidth = Math.min(THUMB_MAX, image.width);
  const srcSet =
    image.width > THUMB_MAX
      ? `${image.thumbnailUrl} ${thumbWidth}w, ${image.url} ${image.width}w`
      : `${image.url} ${image.width}w`;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- renditions are optimised by the API
    <img
      src={image.thumbnailUrl}
      srcSet={srcSet}
      sizes={sizes}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={clsx('bg-sunk', className)}
      style={style}
    />
  );
}
