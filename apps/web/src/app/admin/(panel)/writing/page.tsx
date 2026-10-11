import {
  CONTENT_KIND_LABELS,
  CONTENT_KINDS,
  CONTENT_STATUSES,
  type AdminContent,
  type ContentKind,
  type ContentStatus,
  type DashboardStats,
  type Paginated,
} from '@ds/contracts';
import Link from 'next/link';
import {
  AdminEmpty,
  AdminHeader,
  AdminPagination,
  FilterTabs,
  formatRelative,
  SearchForm,
  StatusBadge,
} from '@/components/admin/admin-ui';
import { ContentRowActions } from '@/components/admin/content-row-actions';
import { Icon } from '@/components/admin/icons';
import { adminGet } from '@/lib/api/server';
import { parsePage } from '@/lib/site';

export const metadata = { title: 'Writing' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const STATUS_LABEL: Record<ContentStatus, string> = {
  PUBLISHED: 'Published',
  DRAFT: 'Drafts',
  ARCHIVED: 'Archived',
};

export default async function AdminWritingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = CONTENT_STATUSES.find((s) => s === first(params.status));
  const kind = CONTENT_KINDS.find((k) => k === first(params.kind));
  const search = first(params.search)?.slice(0, 100) || undefined;
  const page = parsePage(params.page);

  const [result, stats] = await Promise.all([
    adminGet<Paginated<AdminContent>>('/admin/content', {
      status,
      kind,
      search,
      page,
      pageSize: 20,
    }),
    adminGet<DashboardStats>('/admin/stats'),
  ]);
  const counts: Record<ContentStatus, number> = {
    PUBLISHED: stats.content.published,
    DRAFT: stats.content.draft,
    ARCHIVED: stats.content.archived,
  };

  const hrefFor = (
    p: number,
    over: { status?: ContentStatus | null; kind?: ContentKind | null } = {},
  ) => {
    const qs = new URLSearchParams();
    const s = over.status === undefined ? status : over.status;
    const k = over.kind === undefined ? kind : over.kind;
    if (s) qs.set('status', s);
    if (k) qs.set('kind', k);
    if (search) qs.set('search', search);
    if (p > 1) qs.set('page', String(p));
    const q = qs.toString();
    return q ? `/admin/writing?${q}` : '/admin/writing';
  };
  const filtered = Boolean(search || kind || status);

  return (
    <>
      <AdminHeader
        title="Writing"
        description="Poems, quotes, prose and Bookworm's Closet notes."
        action={
          <Link href="/admin/writing/new" className="btn btn-primary">
            <Icon.plus className="h-4 w-4" />
            New writing
          </Link>
        }
      />

      <FilterTabs
        label="Filter by status"
        options={[
          {
            href: hrefFor(1, { status: null }),
            label: 'All',
            count: counts.PUBLISHED + counts.DRAFT + counts.ARCHIVED,
            active: !status,
          },
          ...CONTENT_STATUSES.map((s) => ({
            href: hrefFor(1, { status: s }),
            label: STATUS_LABEL[s],
            count: counts[s],
            active: status === s,
          })),
        ]}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by type" className="flex flex-wrap gap-2 text-sm">
          {[undefined, ...CONTENT_KINDS].map((k) => (
            <Link
              key={k ?? 'all'}
              href={hrefFor(1, { kind: k ?? null })}
              aria-current={kind === k ? 'page' : undefined}
              className="chip"
            >
              {k ? CONTENT_KIND_LABELS[k] : 'Every type'}
            </Link>
          ))}
        </nav>
        <SearchForm
          action="/admin/writing"
          defaultValue={search}
          placeholder="Search titles"
          keep={{ status, kind }}
        />
      </div>

      <div className="mt-6">
        {result.items.length ? (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
            <table className="w-full text-left text-[0.9375rem]">
              <caption className="sr-only">
                Writing{status ? `, ${STATUS_LABEL[status].toLowerCase()}` : ''}, page {result.page}{' '}
                of {result.totalPages}
              </caption>
              <thead className="hidden border-b border-line text-xs tracking-wide text-ink-subtle uppercase xl:table-header-group">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Title
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Updated
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {result.items.map((item) => (
                  <tr
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-3 px-4 py-3 hover:bg-paper/70 xl:table-row xl:p-0"
                  >
                    <td className="w-full xl:w-auto xl:px-5 xl:py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-line bg-sunk text-ink-subtle sm:flex">
                          {item.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                            <img
                              src={item.coverImage.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Icon.writing className="h-4 w-4" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/writing/${item.id}`}
                            className="block truncate font-medium text-ink hover:underline"
                          >
                            {item.title}
                          </Link>
                          <span className="block truncate text-xs text-ink-subtle">
                            /writing/{item.slug}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="text-sm text-ink-muted xl:px-3 xl:py-3.5">
                      {CONTENT_KIND_LABELS[item.kind]}
                    </td>
                    <td className="xl:px-3 xl:py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="text-sm whitespace-nowrap text-ink-muted xl:px-3 xl:py-3.5">
                      <time
                        dateTime={item.updatedAt}
                        title={new Date(item.updatedAt).toLocaleString('en')}
                      >
                        {formatRelative(item.updatedAt)}
                      </time>
                    </td>
                    <td className="ml-auto xl:px-5 xl:py-2">
                      <ContentRowActions item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered ? (
          <AdminEmpty
            title="No matches"
            icon="search"
            action={
              <Link href="/admin/writing" className="btn btn-ghost">
                Clear filters
              </Link>
            }
          >
            Nothing matches these filters{search ? ` and “${search}”` : ''}.
          </AdminEmpty>
        ) : (
          <AdminEmpty
            title="The notebook is empty"
            action={
              <Link href="/admin/writing/new" className="btn btn-primary">
                Write your first piece
              </Link>
            }
          >
            Poems, quotes, prose and book notes you write here appear on the site once published.
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
