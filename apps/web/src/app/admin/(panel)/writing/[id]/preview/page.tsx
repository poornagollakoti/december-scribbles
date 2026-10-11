import { CONTENT_KIND_LABELS } from '@ds/contracts';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/admin-ui';
import { Icon } from '@/components/admin/icons';
import { ResponsiveImage } from '@/components/responsive-image';
import { WritingBody } from '@/components/writing-body';
import { loadContent } from '@/lib/admin-data';

export const metadata = { title: 'Preview' };

/** Shows a piece exactly as the public page would set it, including drafts. */
export default async function PreviewWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const item = await loadContent((await params).id);
  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line bg-surface px-4 py-3 text-sm">
        <span className="flex items-center gap-3">
          <StatusBadge status={item.status} />
          <span className="text-ink-muted">
            Preview.{' '}
            {item.status === 'PUBLISHED'
              ? 'This is how the live page reads.'
              : 'Not visible on the site.'}
          </span>
        </span>
        <Link href={`/admin/writing/${item.id}`} className="btn btn-ghost min-h-9 py-1.5 text-sm">
          <Icon.edit className="h-4 w-4" /> Back to editing
        </Link>
      </div>

      <article className="mx-auto max-w-4xl">
        <header className="pb-12 text-center">
          <p className="eyebrow">{CONTENT_KIND_LABELS[item.kind]}</p>
          <h1 className="mt-5 text-display">{item.title}</h1>
        </header>
        {item.coverImage && (
          <div className="print-frame mx-auto mb-14 w-fit">
            <ResponsiveImage
              image={item.coverImage}
              sizes="(min-width: 1024px) 56rem, 100vw"
              className="h-auto max-h-[70vh] w-auto"
            />
          </div>
        )}
        <WritingBody kind={item.kind} body={item.body} />
      </article>
    </>
  );
}
