import {
  GALLERY_SORTS,
  GALLERY_VISIBILITIES,
  type AdminGalleryListResponse,
  type DashboardStats,
  type GallerySort,
  type GalleryVisibility,
} from '@ds/contracts';
import Link from 'next/link';
import {
  AdminEmpty,
  AdminHeader,
  AdminPagination,
  FilterTabs,
  SearchForm,
} from '@/components/admin/admin-ui';
import { ArtworkCardActions } from '@/components/admin/artwork-card-actions';
import { Icon } from '@/components/admin/icons';
import { adminGet } from '@/lib/api/server';
import { parsePage } from '@/lib/site';

export const metadata = { title: 'Posters & Illustrations' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminGalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const visibility = GALLERY_VISIBILITIES.find((v) => v === first(params.visibility));
  const sort: GallerySort = GALLERY_SORTS.find((s) => s === first(params.sort)) ?? 'order';
  const category = first(params.category)?.slice(0, 60) || undefined;
  const search = first(params.search)?.slice(0, 100) || undefined;
  const page = parsePage(params.page);

  const [result, stats] = await Promise.all([
    adminGet<AdminGalleryListResponse>('/admin/gallery', {
      visibility,
      category,
      search,
      sort,
      page,
      pageSize: 24,
    }),
    adminGet<DashboardStats>('/admin/stats'),
  ]);

  const hrefFor = (
    p: number,
    over: {
      visibility?: GalleryVisibility | null;
      category?: string | null;
      sort?: GallerySort;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    const v = over.visibility === undefined ? visibility : over.visibility;
    const c = over.category === undefined ? category : over.category;
    const s = over.sort ?? sort;
    if (v) qs.set('visibility', v);
    if (c) qs.set('category', c);
    if (search) qs.set('search', search);
    if (s !== 'order') qs.set('sort', s);
    if (p > 1) qs.set('page', String(p));
    const q = qs.toString();
    return q ? `/admin/gallery?${q}` : '/admin/gallery';
  };
  const filtered = Boolean(visibility || category || search);

  return (
    <>
      <AdminHeader
        title="Posters & Illustrations"
        description="The sketchbook. Published pieces appear in the gallery and on the homepage."
        action={
          <Link href="/admin/gallery/new" className="btn btn-primary">
            <Icon.plus className="h-4 w-4" />
            Add artwork
          </Link>
        }
      />

      <FilterTabs
        label="Filter by status"
        options={[
          {
            href: hrefFor(1, { visibility: null }),
            label: 'All',
            count: stats.gallery.published + stats.gallery.hidden,
            active: !visibility,
          },
          {
            href: hrefFor(1, { visibility: 'published' }),
            label: 'Published',
            count: stats.gallery.published,
            active: visibility === 'published',
          },
          {
            href: hrefFor(1, { visibility: 'hidden' }),
            label: 'Hidden',
            count: stats.gallery.hidden,
            active: visibility === 'hidden',
          },
        ]}
      />

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {result.categories.length > 0 && (
            <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
              <Link
                href={hrefFor(1, { category: null })}
                aria-current={!category ? 'page' : undefined}
                className="chip"
              >
                Every category
              </Link>
              {result.categories.map((c) => (
                <Link
                  key={c}
                  href={hrefFor(1, { category: c })}
                  aria-current={category === c ? 'page' : undefined}
                  className="chip"
                >
                  {c}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Sort" className="flex gap-2">
            <Link
              href={hrefFor(1, { sort: 'order' })}
              aria-current={sort === 'order' ? 'page' : undefined}
              className="chip"
            >
              Display order
            </Link>
            <Link
              href={hrefFor(1, { sort: 'updated' })}
              aria-current={sort === 'updated' ? 'page' : undefined}
              className="chip"
            >
              Recently edited
            </Link>
          </nav>
          <SearchForm
            action="/admin/gallery"
            defaultValue={search}
            placeholder="Search titles"
            keep={{ visibility, category, sort: sort === 'order' ? undefined : sort }}
          />
        </div>
      </div>

      <div className="mt-6">
        {result.items.length ? (
          <ul className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
            {result.items.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 flex-col rounded-[var(--radius-lg)] border border-line bg-surface transition-colors hover:border-ink"
              >
                <Link href={`/admin/gallery/${item.id}`} className="group block">
                  {/* Uniform frame; the artwork is contained, never cropped. */}
                  <span className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-sunk p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img
                      src={item.image.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="max-h-full max-w-full object-contain shadow-[var(--shadow-print)] transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </span>
                  <span className="block px-3 pt-3 pb-2">
                    <span className="block truncate font-medium group-hover:underline">
                      {item.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink-subtle">
                      <span className="truncate">{item.category ?? 'No category'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">#{item.displayOrder}</span>
                    </span>
                    {!item.altText.trim() && (
                      <span className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                        <Icon.warning className="h-3.5 w-3.5" /> Missing alt text
                      </span>
                    )}
                  </span>
                </Link>
                <div className="mt-auto">
                  <ArtworkCardActions item={item} />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered ? (
          <AdminEmpty
            title="No matches"
            icon="search"
            action={
              <Link href="/admin/gallery" className="btn btn-ghost">
                Clear filters
              </Link>
            }
          >
            No artwork matches these filters.
          </AdminEmpty>
        ) : (
          <AdminEmpty
            title="The sketchbook is empty"
            icon="artwork"
            action={
              <Link href="/admin/gallery/new" className="btn btn-primary">
                Add your first piece
              </Link>
            }
          >
            Upload a poster or illustration, give it a title and alt text, and publish it.
          </AdminEmpty>
        )}
      </div>

      <AdminPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        hrefFor={(p) => hrefFor(p)}
      />
    </>
  );
}
