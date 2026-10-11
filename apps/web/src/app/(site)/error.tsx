'use client';

import { CircleAlert, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/icon';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page pt-2 pb-[var(--spacing-section)] sm:pt-4">
      <div className="grid min-h-[60svh] place-items-center rounded-[var(--radius-xl)] bg-surface px-6 py-20 text-center shadow-[var(--shadow-sm)] ring-1 ring-line">
        <div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <Icon icon={CircleAlert} size="lg" />
          </span>
          <h1 className="mt-6 text-title">
            The ink ran dry <span className="accent-serif text-rose">for a moment</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lead text-ink-2">
            This page could not be loaded right now. Please try again in a little while.
          </p>
          {error.digest && <p className="mt-3 text-sm text-ink-3">Reference: {error.digest}</p>}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={reset} className="btn btn-primary">
              <Icon icon={RotateCw} size="sm" />
              Try again
            </button>
            <Link href="/" className="btn btn-ghost">
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
