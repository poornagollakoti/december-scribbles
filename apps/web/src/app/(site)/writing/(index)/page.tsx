import { CONTENT_KIND_LABELS, CONTENT_KINDS, type ContentKind } from '@ds/contracts';
import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, EmptyState, FilterTabs, PageHeader, Pagination } from '@/components/ui';
import { WritingLead, WritingRow } from '@/components/writing-index';
import { getKindCounts, listWriting } from '@/lib/api/public';
import { COPY } from '@/lib/copy';
import { parsePage } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Writing',
  description: "Poetry, quotes, prose and Bookworm's Closet reading notes from December Scribbles.",
  alternates: { canonical: '/writing' },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const PAGE_SIZE = 15;

function parseKind(value: string | string[] | undefined): ContentKind | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return CONTENT_KINDS.find((k) => k === v);
}

export default async function WritingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const kind = parseKind(params.kind);
  const page = parsePage(params.page);
  const [result, kinds] = await Promise.all([
    listWriting({ kind, page, pageSize: PAGE_SIZE }),
    getKindCounts(),
  ]);
  const total = kinds.reduce((sum, k) => sum + k.count, 0);

  const hrefFor = (p: number, k: ContentKind | undefined = kind) => {
    const qs = new URLSearchParams();
    if (k) qs.set('kind', k);
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return s ? `/writing?${s}` : '/writing';
  };

  // The newest piece leads the first page; the rest form the index.
  const showLead = page === 1 && result.items.length > 0;
  const [lead, ...rest] = result.items;
  const rows = showLead ? rest : result.items;

  return (
    <Container className="pb-[var(--spacing-section)]">
      <PageHeader
        eyebrow="The notebook"
        title={kind ? CONTENT_KIND_LABELS[kind] : 'Writing'}
        count={kind ? result.total : total}
      >
        <p>
          Poems, quotes, small stories and notes from good books, written for whatever inspires.
        </p>
      </PageHeader>

      {/* Filtering only makes sense once more than one type exists. */}
      {kinds.length > 1 && (
        <div className="mb-10">
          <FilterTabs
            label="Filter writing by type"
            options={[
              { href: hrefFor(1, undefined), label: 'Everything', count: total, active: !kind },
              ...kinds.map((k) => ({
                href: hrefFor(1, k.kind),
                label: CONTENT_KIND_LABELS[k.kind],
                count: k.count,
                active: kind === k.kind,
              })),
            ]}
          />
        </div>
      )}

      {result.items.length ? (
        <>
          {showLead && lead && <WritingLead item={lead} />}
          {rows.length > 0 && (
            <ol className="mt-10 divide-y divide-line border-y border-line">
              {rows.map((item) => (
                <WritingRow key={item.id} item={item} />
              ))}
            </ol>
          )}
        </>
      ) : (
        <EmptyState
          title={kind ? 'Nothing here yet.' : COPY.empty.writing.title}
          icon={BookOpen}
          action={
            kind ? (
              <Link href="/writing" className="btn btn-ghost">
                See all writing
              </Link>
            ) : undefined
          }
        >
          {kind
            ? `No ${CONTENT_KIND_LABELS[kind].toLowerCase()} has been published yet.`
            : COPY.empty.writing.body}
        </EmptyState>
      )}

      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => hrefFor(p)} />
    </Container>
  );
}
