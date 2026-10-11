import { BookOpen, Compass } from 'lucide-react';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { Arrow } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="container-page pt-2 pb-[var(--spacing-section)] sm:pt-4">
      <div className="grid min-h-[60svh] place-items-center rounded-[var(--radius-xl)] bg-surface px-6 py-20 text-center shadow-[var(--shadow-sm)] ring-1 ring-line">
        <div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blush-soft text-rose">
            <Icon icon={Compass} size="lg" />
          </span>
          <p className="mt-6 text-meta text-ink-2">Error 404</p>
          <h1 className="mt-3 text-display">
            This page <span className="accent-serif text-rose">wandered off</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lead text-ink-2">
            It may have been moved or unpublished. The notebook is still here, though.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              Back to the start
              <Arrow />
            </Link>
            <Link href="/writing" className="btn btn-ghost">
              <Icon icon={BookOpen} size="sm" />
              Read the writing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
