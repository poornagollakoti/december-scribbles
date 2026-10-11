'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Segmented pill navigation; the active section gets a raised surface. */
export function NavPills({ links }: { links: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1 rounded-full bg-muted/80 p-1">
      {links.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'inline-flex min-h-9 items-center rounded-full px-4 text-[0.9375rem] font-medium transition-all duration-200',
                active
                  ? 'bg-surface text-ink shadow-[var(--shadow-sm)]'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
