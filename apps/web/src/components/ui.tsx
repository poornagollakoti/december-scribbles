import clsx from 'clsx';
import { ArrowRight, ChevronLeft, ChevronRight, type LucideIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Icon } from './icon';

/*
 * Shared presentational building blocks for the public site.
 */

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={clsx('container-page', className)}>{children}</div>;
}

/** Small sentence-case label with a rose dot. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={clsx('kicker', className)}>{children}</p>;
}

/** Arrow used inside buttons and links; slides on hover via .btn-arrow. */
export function Arrow({ className }: { className?: string }) {
  return <Icon icon={ArrowRight} size="sm" className={clsx('btn-arrow', className)} />;
}

/** "See all" style link: text + arrow in a quiet pill. */
export function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="btn btn-ghost btn-sm">
      {children}
      <Arrow />
    </Link>
  );
}

/** Section heading: kicker + large title, with an optional action on the right. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  action,
  className,
  tone = 'light',
}: {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-x-8 gap-y-5', className)}>
      <div className="max-w-3xl">
        <p className={clsx('kicker', tone === 'dark' && 'text-on-dark-2 before:bg-blush')}>
          {eyebrow}
        </p>
        <h2 id={id} className={clsx('mt-3 text-title', tone === 'dark' && 'text-on-dark')}>
          {title}
        </h2>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

/** Title block for inner pages: oversized headline, optional count and standfirst. */
export function PageHeader({
  eyebrow,
  title,
  count,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <header className="grid gap-8 pt-12 pb-10 sm:pt-20 sm:pb-14 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <p className="kicker motion-safe:animate-rise">{eyebrow}</p>
        <h1 className="mt-4 flex items-start gap-3 text-display motion-safe:animate-rise [animation-delay:70ms]">
          {title}
          {count !== undefined && (
            <span className="mt-[0.35em] rounded-full bg-muted px-2.5 py-1 font-sans text-sm font-medium tracking-normal text-ink-2 tabular-nums">
              {count}
            </span>
          )}
        </h1>
      </div>
      {children && (
        <div className="max-w-md text-lead text-ink-2 motion-safe:animate-rise [animation-delay:140ms] lg:col-span-4 lg:justify-self-end">
          {children}
        </div>
      )}
    </header>
  );
}

export function EmptyState({
  title,
  children,
  icon = Sparkles,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl)] bg-surface px-6 py-16 text-center shadow-[var(--shadow-sm)] ring-1 ring-line">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blush-soft text-rose">
        <Icon icon={icon} />
      </span>
      <p className="mt-5 font-display text-heading">{title}</p>
      {children && <div className="mt-2 max-w-md text-ink-2">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="btn btn-ghost">
          <Icon icon={ChevronLeft} size="sm" />
          Newer
        </Link>
      ) : (
        <span className="btn btn-ghost" aria-disabled="true">
          <Icon icon={ChevronLeft} size="sm" />
          Newer
        </span>
      )}
      <span className="px-3 text-sm text-ink-2 tabular-nums">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className="btn btn-ghost">
          Older
          <Icon icon={ChevronRight} size="sm" />
        </Link>
      ) : (
        <span className="btn btn-ghost" aria-disabled="true">
          Older
          <Icon icon={ChevronRight} size="sm" />
        </span>
      )}
    </nav>
  );
}

/** Filter chips (server-rendered links, shareable URLs). */
export function FilterTabs({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-[var(--spacing-gutter)] overflow-x-auto px-[var(--spacing-gutter)] py-1"
    >
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
