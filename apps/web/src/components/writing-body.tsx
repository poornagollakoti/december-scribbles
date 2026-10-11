import type { ContentKind } from '@ds/contracts';
import clsx from 'clsx';
import { paragraphs } from '@/lib/site';

/**
 * Renders plain-text writing safely (React escapes all text; no HTML is interpreted).
 * Single line breaks are kept (they matter in poetry); blank lines start a new stanza or
 * paragraph. Poems and quotes are set in the serif; prose in the reading sans at a
 * comfortable measure.
 */
export function WritingBody({
  kind,
  body,
  align = 'center',
}: {
  kind: ContentKind;
  body: string;
  align?: 'center' | 'start';
}) {
  const blocks = paragraphs(body);
  const centred = align === 'center';

  if (kind === 'QUOTE') {
    return (
      <blockquote className={clsx('max-w-3xl', centred && 'mx-auto text-center')}>
        {blocks.map((block, i) => (
          <p
            key={i}
            className={clsx(
              'font-serif text-[clamp(2rem,1.4rem+2.6vw,3.4rem)] leading-[1.12] whitespace-pre-line',
              i > 0 && 'mt-6',
            )}
          >
            {i === 0 && <span className="text-rose">“</span>}
            {block}
            {i === blocks.length - 1 && <span className="text-rose">”</span>}
          </p>
        ))}
      </blockquote>
    );
  }

  if (kind === 'POEM') {
    return (
      <div className={clsx('max-w-full', centred ? 'mx-auto w-fit' : 'w-fit')}>
        {blocks.map((block, i) => (
          <p
            key={i}
            className={clsx('font-serif text-poem whitespace-pre-line', i > 0 && 'mt-[1.3em]')}
          >
            {block}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'max-w-[var(--container-measure)] text-[1.125rem] leading-[1.8] text-ink',
        centred && 'mx-auto',
      )}
    >
      {blocks.map((block, i) => (
        <p
          key={i}
          className={clsx(
            'whitespace-pre-line',
            i > 0 && 'mt-6',
            // Editorial drop cap on the opening paragraph.
            i === 0 &&
              'first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-serif first-letter:text-[4.4rem] first-letter:leading-[0.8] first-letter:text-rose',
          )}
        >
          {block}
        </p>
      ))}
    </div>
  );
}
