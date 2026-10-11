'use client';

import type { Role, SessionUser } from '@ds/contracts';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { apiRequest } from '@/lib/api/client';
import { Monogram } from '../brand';
import { Icon } from './icons';

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof Icon;
  exact?: boolean;
  badge?: number;
  roles?: Role[];
};

const SECTION_LABELS: Record<string, string> = {
  writing: 'Writing',
  gallery: 'Posters & Illustrations',
  media: 'Media library',
  enquiries: 'Enquiries',
  profile: 'Settings',
  new: 'New',
  preview: 'Preview',
};

function navGroups(newEnquiries: number): { label: string; items: NavItem[] }[] {
  return [
    {
      label: 'Content',
      items: [
        { href: '/admin', label: 'Overview', icon: 'overview', exact: true },
        { href: '/admin/writing', label: 'Writing', icon: 'writing' },
        { href: '/admin/gallery', label: 'Posters & Illustrations', icon: 'artwork' },
        { href: '/admin/media', label: 'Media library', icon: 'media' },
      ],
    },
    {
      label: 'Inbox',
      items: [
        {
          href: '/admin/enquiries',
          label: 'Enquiries',
          icon: 'inbox',
          badge: newEnquiries,
          roles: ['ADMIN'],
        },
      ],
    },
    {
      label: 'Site',
      items: [{ href: '/admin/profile', label: 'Settings', icon: 'settings', roles: ['ADMIN'] }],
    },
  ];
}

/** Breadcrumbs from the URL: /admin/writing/<id>/preview → Studio / Writing / Edit / Preview. */
function useBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean).slice(1); // drop "admin"
  const crumbs = [{ href: '/admin', label: 'Studio' }];
  let href = '/admin';
  for (const part of parts) {
    href += `/${part}`;
    crumbs.push({ href, label: SECTION_LABELS[part] ?? 'Edit' });
  }
  return crumbs;
}

const COLLAPSE_KEY = 'ds-studio-sidebar-collapsed';
const COLLAPSE_EVENT = 'ds-studio-sidebar';

/** The collapsed preference lives in localStorage; read it as an external store. */
function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false; // storage unavailable
  }
}
function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}
function subscribeCollapsed(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function StudioFrame({
  user,
  newEnquiries,
  children,
}: {
  user: SessionUser;
  newEnquiries: number;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    drawerRef.current?.close();
  }, [pathname]);

  const toggleCollapsed = () => writeCollapsed(!collapsed);

  const groups = navGroups(newEnquiries)
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(user.role)) }))
    .filter((g) => g.items.length);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a
        href="#studio-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-dialog)] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-[var(--z-raised)] hidden flex-col bg-forest text-on-dark transition-[width] duration-300 ease-[var(--ease-soft)] lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <SidebarContent groups={groups} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      <dialog
        ref={drawerRef}
        aria-label="Studio navigation"
        className="animated-dialog m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none bg-forest p-0 text-on-dark"
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end p-2">
            <button
              type="button"
              autoFocus
              onClick={() => drawerRef.current?.close()}
              className="inline-flex h-11 w-11 items-center justify-center hover:bg-sunk"
              aria-label="Close navigation"
            >
              <Icon.close />
            </button>
          </div>
          <SidebarContent groups={groups} collapsed={false} />
        </div>
      </dialog>

      <div
        className={clsx(
          'transition-[padding] duration-300 ease-[var(--ease-soft)]',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64',
        )}
      >
        <TopBar user={user} onOpenDrawer={() => drawerRef.current?.showModal()} />
        <main
          id="studio-main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 focus:outline-none sm:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  groups,
  collapsed,
  onToggle,
}: {
  groups: { label: string; items: NavItem[] }[];
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      <div
        className={clsx(
          'flex h-16 items-center border-b border-line-dark',
          collapsed ? 'justify-center' : 'gap-2 px-5',
        )}
      >
        <Link href="/admin" className="flex items-center gap-2" aria-label="Studio overview">
          <Monogram tone="dark" className="h-8 w-8 shrink-0 text-on-dark" />
          {!collapsed && (
            <span className="leading-none">
              <span className="block text-[0.7rem] text-on-dark-2">December Scribbles</span>
              <span className="mt-0.5 block font-display text-[1.35rem] font-semibold tracking-[-0.03em]">
                Studio
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav aria-label="Studio" className="flex-1 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-[0.75rem] font-medium text-on-dark-2">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const ItemIcon = Icon[item.icon];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'has-tooltip relative flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[0.9375rem] transition-colors',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-on-dark text-forest shadow-[var(--shadow-sm)]'
                          : 'text-on-dark-2 hover:bg-forest-2 hover:text-on-dark',
                      )}
                    >
                      <ItemIcon className="h-[1.125rem] w-[1.125rem] shrink-0" />
                      <span className={collapsed ? 'sr-only' : 'flex-1 truncate'}>
                        {item.label}
                      </span>
                      {collapsed && (
                        <span className="tooltip tooltip-right" aria-hidden="true">
                          {item.label}
                        </span>
                      )}
                      {item.badge ? (
                        <span
                          className={clsx(
                            'rounded-full bg-brand px-1.5 text-[0.7rem] leading-5 font-semibold text-white tabular-nums',
                            collapsed && 'absolute top-0.5 right-1.5',
                          )}
                        >
                          {item.badge}
                          <span className="sr-only"> new</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line-dark p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'View site' : undefined}
          className={clsx(
            'flex min-h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[0.9375rem] text-on-dark-2 hover:bg-forest-2 hover:text-on-dark',
            collapsed && 'justify-center px-0',
          )}
        >
          <Icon.external className="h-[1.125rem] w-[1.125rem] shrink-0" />
          <span className={collapsed ? 'sr-only' : undefined}>View site</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'mt-0.5 flex min-h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[0.9375rem] text-on-dark-2 hover:bg-forest-2 hover:text-on-dark',
              collapsed && 'justify-center px-0',
            )}
          >
            <Icon.collapse
              className={clsx('h-[1.125rem] w-[1.125rem] shrink-0', collapsed && 'rotate-180')}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </>
  );
}

function TopBar({ user, onOpenDrawer }: { user: SessionUser; onOpenDrawer: () => void }) {
  const crumbs = useBreadcrumbs();
  return (
    <header className="sticky top-0 z-[var(--z-raised)] border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-8">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="-ml-2 inline-flex h-11 w-11 items-center justify-center hover:bg-sunk lg:hidden"
          aria-label="Open navigation"
        >
          <Icon.menu />
        </button>
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex items-center gap-2 truncate text-sm text-ink-muted">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li
                  key={c.href}
                  className={clsx('flex items-center gap-2', !last && 'hidden sm:flex')}
                >
                  {last ? (
                    <span aria-current="page" className="font-medium text-ink">
                      {c.label}
                    </span>
                  ) : (
                    <>
                      <Link href={c.href} className="hover:text-ink hover:underline">
                        {c.label}
                      </Link>
                      <span aria-hidden="true">/</span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <CreateMenu />
        <AccountMenu user={user} />
      </div>
    </header>
  );
}

/** Disclosure menu: button + list of links. Escape or an outside click closes it. */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  // Close after navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        (ref.current?.querySelector('button') as HTMLButtonElement | null)?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

const menuPanel =
  'absolute right-0 top-full z-[var(--z-overlay)] mt-2 min-w-56 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface py-1.5 shadow-[var(--shadow-lg)] motion-safe:animate-fade';
const menuItem =
  'flex min-h-10 w-full items-center gap-3 px-4 text-left text-[0.9375rem] text-ink hover:bg-sunk focus-visible:bg-sunk';

function CreateMenu() {
  const { open, setOpen, ref } = useDisclosure();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="create-menu"
        onClick={() => setOpen((o) => !o)}
        className="btn btn-primary min-h-10 gap-1.5 px-3 py-2 text-sm sm:px-4"
      >
        <Icon.plus className="h-4 w-4" />
        <span className="hidden sm:inline">Create</span>
        <span className="sr-only sm:hidden">Create new</span>
        <Icon.chevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <ul id="create-menu" className={menuPanel}>
          <li>
            <Link href="/admin/writing/new" className={menuItem}>
              <Icon.writing /> New writing
            </Link>
          </li>
          <li>
            <Link href="/admin/gallery/new" className={menuItem}>
              <Icon.artwork /> New poster or illustration
            </Link>
          </li>
          <li>
            <Link href="/admin/media" className={menuItem}>
              <Icon.upload /> Upload images
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const { open, setOpen, ref } = useDisclosure();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    setBusy(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-full pr-1 pl-1 hover:bg-sunk"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-night text-xs font-semibold text-night-ink">
          {initials}
        </span>
        <span className="sr-only">Account: {user.name}</span>
        <Icon.chevronDown className="hidden h-3.5 w-3.5 sm:block" />
      </button>
      {open && (
        <div id="account-menu" className={menuPanel}>
          <div className="border-b border-line px-4 pt-2 pb-3">
            <p className="font-medium">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
            <p className="eyebrow mt-1.5 text-[0.65rem]">
              {user.role === 'ADMIN' ? 'Administrator' : 'Editor'}
            </p>
          </div>
          <ul className="pt-1.5">
            <li>
              <a href="/" target="_blank" rel="noopener noreferrer" className={menuItem}>
                <Icon.external /> View site<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <button type="button" onClick={signOut} disabled={busy} className={menuItem}>
                <Icon.signOut /> {busy ? 'Signing out…' : 'Sign out'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
