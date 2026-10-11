'use client';

import { ArrowUpRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { COPY } from '@/lib/copy';
import { Wordmark } from './brand';
import { Icon } from './icon';
import { isActivePath } from './nav-link';

/**
 * Full-screen menu for small screens on a modal <dialog> (focus trap, Escape to close,
 * focus returns to the trigger). Recomposed for touch: large targets, thumb-reachable CTA.
 */
export function MobileMenu({
  name,
  links,
  instagramUrl,
}: {
  name: string;
  links: readonly { href: string; label: string }[];
  instagramUrl: string | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const items = [{ href: '/', label: 'Home' }, ...links, { href: '/contact', label: 'Contact' }];

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="icon-btn icon-btn-outline"
        aria-haspopup="dialog"
        aria-label="Menu"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Icon icon={Menu} />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="animated-dialog m-0 h-dvh max-h-none w-full max-w-none bg-forest p-0 text-on-dark backdrop:bg-transparent"
      >
        <div className="container-page flex h-full flex-col">
          <div className="flex h-16 items-center justify-between">
            <Wordmark name={name} tone="dark" />
            <button
              type="button"
              autoFocus
              aria-label="Close"
              className="icon-btn text-on-dark hover:bg-forest-2 hover:text-on-dark"
              onClick={() => dialogRef.current?.close()}
            >
              <Icon icon={X} />
            </button>
          </div>

          <nav aria-label="Main" className="flex flex-1 flex-col justify-center py-8">
            <ul className="space-y-1">
              {items.map((link, i) => {
                const active =
                  link.href === '/' ? pathname === '/' : isActivePath(pathname, link.href);
                return (
                  <li
                    key={link.href}
                    className="motion-safe:animate-rise"
                    style={{ animationDelay: `${60 + i * 50}ms` }}
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => dialogRef.current?.close()}
                      className="group flex items-center justify-between py-2 font-display text-[2.6rem] leading-tight font-semibold tracking-[-0.035em]"
                    >
                      <span className={active ? 'text-blush' : undefined}>{link.label}</span>
                      <Icon
                        icon={ArrowUpRight}
                        size="lg"
                        className="text-on-dark-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 pb-8">
            <Link href="/contact" className="btn btn-blush w-full">
              Say hello
            </Link>
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-on-dark w-full"
              >
                {COPY.instagramHandle}
                <Icon icon={ArrowUpRight} size="sm" />
                <span className="sr-only"> on Instagram (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
