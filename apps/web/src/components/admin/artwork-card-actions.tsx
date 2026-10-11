'use client';

import type { AdminGalleryItem } from '@ds/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { useFeedback } from './feedback';
import { Icon } from './icons';

/** Publish switch, view and delete for an artwork card. All changes persist via the API. */
export function ArtworkCardActions({ item }: { item: AdminGalleryItem }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [published, setPublished] = useState(item.isPublished);

  const toggle = async () => {
    const next = !published;
    setBusy(true);
    setPublished(next); // optimistic; reverted on failure
    try {
      await apiRequest(`/admin/gallery/${item.id}`, {
        method: 'PATCH',
        json: { isPublished: next },
      });
      await refreshPublicSite(['gallery']);
      toast(next ? `“${item.title}” is now on the site.` : `“${item.title}” is hidden.`);
      router.refresh();
    } catch (e) {
      setPublished(!next);
      toast(userMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Remove “${item.title}”?`,
      body: 'It will be taken off the site and out of the Studio. The image itself stays in the media library.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/gallery/${item.id}`, { method: 'DELETE' });
      await refreshPublicSite(['gallery']);
      toast(`“${item.title}” was removed.`);
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-2 sm:gap-2 sm:px-3">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          role="switch"
          checked={published}
          disabled={busy}
          onChange={toggle}
          aria-label={`Show “${item.title}” on the site`}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-5 w-9 rounded-full bg-ink-subtle/40 transition-colors peer-checked:bg-success peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
        />
        <span className={`hidden sm:inline ${published ? 'text-success' : 'text-ink-muted'}`}>
          {published ? 'Published' : 'Hidden'}
        </span>
      </label>
      <div className="flex items-center">
        {published && (
          <a
            href={`/gallery/${item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="has-tooltip icon-btn h-9 w-9"
            aria-label={`View ${item.title} on the site (opens in a new tab)`}
          >
            <Icon.external className="h-4 w-4" />
            <span className="tooltip" aria-hidden="true">
              View live
            </span>
          </a>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="has-tooltip icon-btn h-9 w-9 hover:!text-danger"
          aria-label={`Remove ${item.title}`}
        >
          <Icon.trash className="h-4 w-4" />
          <span className="tooltip" aria-hidden="true">
            Remove
          </span>
        </button>
      </div>
    </div>
  );
}
