import clsx from 'clsx';
import Link from 'next/link';
import { Icon } from './icons';

/*
 * Studio presentational primitives. Square corners, hairline borders and the public
 * site's typography, so the Studio feels like part of December Scribbles.
 */

export function AdminHeader({
  title,
  description,
  action,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <Icon.chevronLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(2rem,1.6rem+1.4vw,2.75rem)] leading-[1.05]">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-ink-muted">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-3">{action}</div>}
      </div>
    </div>
  );
}

const BADGE: Record<string, { dot: string; text: string; label: string }> = {
  PUBLISHED: { dot: 'bg-success', text: 'text-success', label: 'Published' },
  VISIBLE: { dot: 'bg-success', text: 'text-success', label: 'Published' },
  DRAFT: { dot: 'bg-pencil', text: 'text-warning', label: 'Draft' },
  HIDDEN: { dot: 'bg-ink-subtle', text: 'text-ink-muted', label: 'Hidden' },
  ARCHIVED: { dot: 'bg-ink-subtle', text: 'text-ink-muted', label: 'Archived' },
  NEW: { dot: 'bg-brand', text: 'text-brand-deep', label: 'New' },
  READ: { dot: 'bg-night', text: 'text-night', label: 'Read' },
};

/** Status shown as a coloured dot plus a word, so it never relies on colour alone. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const style = BADGE[status] ?? { dot: 'bg-ink-subtle', text: 'text-ink-muted', label: status };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-[0.8125rem] font-medium whitespace-nowrap',
        style.text,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {label ?? style.label}
    </span>
  );
}

export function Panel({
  className,
  title,
  action,
  children,
}: {
  className?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // De-boxed: a heading over a hairline, content directly on the canvas.
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
          <h2 className="font-display text-subheading">{title}</h2>
          {action}
        </div>
      )}
      <div className={title ? 'pt-3' : undefined}>{children}</div>
    </section>
  );
}

export function AdminEmpty({
  title,
  children,
  action,
  icon = 'writing',
}: {
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  icon?: keyof typeof Icon;
}) {
  const EmptyIcon = Icon[icon];
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-surface/70 px-6 py-14 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blush-soft text-rose">
        <EmptyIcon className="h-5 w-5" />
      </span>
      {title && <p className="mt-4 font-display text-heading">{title}</p>}
      {children && <div className="mt-1.5 max-w-md text-ink-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Link-based filter tabs (server-rendered, shareable URLs). */
export function FilterTabs({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 py-1">
      <ul className="flex gap-2">
        {options.map((o) => (
          <li key={o.href}>
            <Link href={o.href} aria-current={o.active ? 'page' : undefined} className="chip">
              {o.label}
              {o.count !== undefined && <span className="chip-count">{o.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminPagination({
  page,
  totalPages,
  total,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  total?: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const cls = 'btn btn-ghost min-h-10 px-4 py-2 text-sm';
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm">
      <span className="text-ink-muted tabular-nums">
        Page {page} of {totalPages}
        {total !== undefined && ` · ${total} items`}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link className={cls} href={hrefFor(page - 1)} rel="prev">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link className={cls} href={hrefFor(page + 1)} rel="next">
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

/** "3 minutes ago", "yesterday", "12 Oct 2026". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const abs = Math.abs(seconds);
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), 'day');
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    date,
  );
}

/** Search box that submits as a normal GET form (keeps other filters via hidden inputs). */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  keep,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} role="search" className="relative w-full sm:w-64">
      {Object.entries(keep ?? {}).map(([k, v]) =>
        v ? <input key={k} type="hidden" name={k} value={v} /> : null,
      )}
      <label htmlFor="studio-search" className="sr-only">
        {placeholder}
      </label>
      <Icon.search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input
        id="studio-search"
        name="search"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="field-input min-h-10 py-2 pl-9"
      />
    </form>
  );
}
