import {
  CONTENT_KIND_LABELS,
  type AdminContent,
  type AdminGalleryListResponse,
  type DashboardStats,
  type Paginated,
  type SessionUser,
} from '@ds/contracts';
import Link from 'next/link';
import {
  AdminHeader,
  AdminEmpty,
  formatRelative,
  Panel,
  StatusBadge,
} from '@/components/admin/admin-ui';
import { Icon } from '@/components/admin/icons';
import { adminGet } from '@/lib/api/server';

export const metadata = { title: 'Overview' };

type RecentItem = {
  key: string;
  type: 'writing' | 'artwork';
  title: string;
  detail: string;
  status: string;
  updatedAt: string;
  href: string;
  thumb: string | null;
};

export default async function AdminOverviewPage() {
  const [stats, user, recentWriting, recentArtwork, drafts] = await Promise.all([
    adminGet<DashboardStats>('/admin/stats'),
    adminGet<SessionUser>('/auth/me'),
    adminGet<Paginated<AdminContent>>('/admin/content', { pageSize: 6 }),
    adminGet<AdminGalleryListResponse>('/admin/gallery', { sort: 'updated', pageSize: 6 }),
    adminGet<Paginated<AdminContent>>('/admin/content', { status: 'DRAFT', pageSize: 5 }),
  ]);

  const recent: RecentItem[] = [
    ...recentWriting.items.map((w) => ({
      key: `w-${w.id}`,
      type: 'writing' as const,
      title: w.title,
      detail: CONTENT_KIND_LABELS[w.kind],
      status: w.status,
      updatedAt: w.updatedAt,
      href: `/admin/writing/${w.id}`,
      thumb: w.coverImage?.thumbnailUrl ?? null,
    })),
    ...recentArtwork.items.map((g) => ({
      key: `g-${g.id}`,
      type: 'artwork' as const,
      title: g.title,
      detail: g.category ?? 'Poster or illustration',
      status: g.isPublished ? 'VISIBLE' : 'HIDDEN',
      updatedAt: g.updatedAt,
      href: `/admin/gallery/${g.id}`,
      thumb: g.image.thumbnailUrl,
    })),
  ]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 7);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const isAdmin = user.role === 'ADMIN';

  const tiles = [
    {
      label: 'Published writing',
      value: stats.content.published,
      note: 'Live on the site',
      href: '/admin/writing',
    },
    {
      label: 'Drafts',
      value: stats.content.draft,
      note: stats.content.archived ? `${stats.content.archived} archived` : 'Not yet public',
      href: '/admin/writing?status=DRAFT',
    },
    {
      label: 'Posters & illustrations',
      value: stats.gallery.published,
      note: `${stats.gallery.hidden} hidden`,
      href: '/admin/gallery',
    },
    isAdmin
      ? {
          label: 'New enquiries',
          value: stats.enquiries.new,
          note: `${stats.enquiries.total} in total`,
          href: '/admin/enquiries?status=NEW',
        }
      : {
          label: 'Images in library',
          value: stats.media.total,
          note: 'Media library',
          href: '/admin/media',
        },
  ];

  return (
    <>
      <AdminHeader
        title={`${greeting}, ${user.name.split(' ')[0]}`}
        description="What's happening across the notebook and the sketchbook."
        action={
          <>
            <Link href="/admin/gallery/new" className="btn btn-ghost">
              <Icon.artwork className="h-4 w-4" />
              Add artwork
            </Link>
            <Link href="/admin/writing/new" className="btn btn-primary">
              <Icon.plus className="h-4 w-4" />
              New writing
            </Link>
          </>
        }
      />

      <ul
        aria-label="At a glance"
        className="grid grid-cols-2 gap-y-6 border-y border-line py-6 lg:grid-cols-4 lg:divide-x lg:divide-line"
      >
        {tiles.map((t) => (
          <li key={t.label} className="lg:px-6 lg:first:pl-0">
            <Link
              href={t.href}
              className="group block h-full rounded-[var(--radius-md)] pr-4 transition-colors"
            >
              <span className="block text-sm text-ink-muted">{t.label}</span>
              <span className="mt-2 block font-display text-[3.25rem] leading-none font-semibold tracking-[-0.04em] tabular-nums transition-colors group-hover:text-rose">
                {t.value}
              </span>
              <span className="mt-2 block text-sm text-ink-subtle group-hover:text-ink">
                {t.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-12 xl:grid-cols-[1fr_20rem]">
        <Panel title="Recently updated">
          {recent.length ? (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="group flex items-center gap-4 py-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-muted text-ink-2">
                      {item.thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                        <img src={item.thumb} alt="" className="h-full w-full object-cover" />
                      ) : item.type === 'writing' ? (
                        <Icon.writing />
                      ) : (
                        <Icon.artwork />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:underline">
                        {item.title}
                      </span>
                      <span className="block text-sm text-ink-muted">
                        {item.type === 'writing' ? 'Writing' : 'Artwork'} · {item.detail}
                      </span>
                    </span>
                    <span className="hidden flex-col items-end gap-0.5 sm:flex">
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-ink-subtle">
                        {formatRelative(item.updatedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty title="Nothing yet" icon="writing">
              Your first piece of writing or artwork will show up here.
            </AdminEmpty>
          )}
        </Panel>

        <div className="space-y-8">
          <Panel
            title="Waiting to be published"
            action={
              drafts.total > drafts.items.length ? (
                <Link
                  href="/admin/writing?status=DRAFT"
                  className="text-sm text-ink-muted hover:text-ink"
                >
                  All {drafts.total}
                </Link>
              ) : undefined
            }
          >
            {drafts.items.length ? (
              <ul className="-my-1 space-y-1">
                {drafts.items.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/writing/${d.id}`} className="block px-2 py-2 hover:bg-sunk">
                      <span className="block truncate">{d.title}</span>
                      <span className="text-xs text-ink-subtle">
                        {CONTENT_KIND_LABELS[d.kind]} · edited {formatRelative(d.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No drafts. Everything written is published.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
