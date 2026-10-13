import { Images } from 'lucide-react';
import type { Metadata } from 'next';
import { ArtworkMasonry } from '@/components/artwork-gallery';
import { Container, EmptyState, FilterTabs, PageHeader, Pagination } from '@/components/ui';
import { listGallery } from '@/lib/api/public';
import { COPY } from '@/lib/copy';
import { parsePage } from '@/lib/site';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Each category or page of the gallery is its own page for search engines. */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category = rawCategory?.slice(0, 60) || undefined;
  const page = parsePage(params.page);
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (page > 1) qs.set('page', String(page));
  const query = qs.toString();
  const label = category ?? 'Gallery';
  return {
    title: page > 1 ? `${label} (page ${page})` : label,
    description: category
      ? `${category}: illustrated posters and artwork by December Scribbles.`
      : 'Illustrated posters, doodles and artwork from December Scribbles.',
    alternates: { canonical: query ? `/gallery?${query}` : '/gallery' },
  };
}

export default async function GalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category = rawCategory?.slice(0, 60) || undefined;
  const page = parsePage(params.page);
  const result = await listGallery({ category, page, pageSize: 24 });

  const hrefFor = (p: number, c: string | undefined = category) => {
    const qs = new URLSearchParams();
    if (c) qs.set('category', c);
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return s ? `/gallery?${s}` : '/gallery';
  };

  return (
    <Container className="pb-[var(--spacing-section)]">
      <PageHeader eyebrow={COPY.gallery.eyebrow} title="The sketchbook" count={result.total}>
        <p>Illustrated posters, doodles and visual notes. Select a piece to see it up close.</p>
      </PageHeader>

      {result.categories.length > 1 && (
        <div className="mb-10">
          <FilterTabs
            label="Filter artwork by category"
            options={[
              { href: hrefFor(1, undefined), label: 'Everything', active: !category },
              ...result.categories.map((c) => ({
                href: hrefFor(1, c),
                label: c,
                active: category === c,
              })),
            ]}
          />
        </div>
      )}

      <div>
        {result.items.length ? (
          <ArtworkMasonry items={result.items} />
        ) : (
          <EmptyState title={COPY.empty.gallery.title} icon={Images}>
            {category ? `Nothing in “${category}” yet.` : COPY.empty.gallery.body}
          </EmptyState>
        )}
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => hrefFor(p)} />
    </Container>
  );
}
