'use client';

import type { AdminContent, ContentStatus } from '@ds/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { useFeedback } from './feedback';
import { Icon } from './icons';

const iconBtn = 'has-tooltip icon-btn h-9 w-9';

/** Row actions for a piece of writing. Every action persists through the API. */
export function ContentRowActions({ item }: { item: AdminContent }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const published = item.status === 'PUBLISHED';

  const setStatus = async (status: ContentStatus) => {
    setBusy(true);
    try {
      await apiRequest(`/admin/content/${item.id}`, { method: 'PATCH', json: { status } });
      await refreshPublicSite(['content']);
      toast(
        status === 'PUBLISHED'
          ? `“${item.title}” is now live.`
          : `“${item.title}” was unpublished.`,
      );
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Delete “${item.title}”?`,
      body: 'This permanently removes the piece from the Studio and the website. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/content/${item.id}`, { method: 'DELETE' });
      await refreshPublicSite(['content']);
      toast(`“${item.title}” was deleted.`);
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => setStatus(published ? 'DRAFT' : 'PUBLISHED')}
        className="btn btn-ghost btn-sm mr-1"
      >
        {published ? <Icon.draft className="h-4 w-4" /> : <Icon.send className="h-4 w-4" />}
        {published ? 'Unpublish' : 'Publish'}
        <span className="sr-only"> {item.title}</span>
      </button>
      <Link
        href={`/admin/writing/${item.id}`}
        className={iconBtn}
        aria-label={`Edit ${item.title}`}
      >
        <Icon.edit className="h-4 w-4" />
        <span className="tooltip" aria-hidden="true">
          Edit
        </span>
      </Link>
      {published ? (
        <a
          href={`/writing/${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconBtn}
          aria-label={`View ${item.title} on the site (opens in a new tab)`}
        >
          <Icon.external className="h-4 w-4" />
          <span className="tooltip" aria-hidden="true">
            View live
          </span>
        </a>
      ) : (
        <Link
          href={`/admin/writing/${item.id}/preview`}
          className={iconBtn}
          aria-label={`Preview ${item.title}`}
        >
          <Icon.eye className="h-4 w-4" />
          <span className="tooltip" aria-hidden="true">
            Preview
          </span>
        </Link>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={remove}
        className={`${iconBtn} hover:text-danger`}
        aria-label={`Delete ${item.title}`}
      >
        <Icon.trash className="h-4 w-4" />
        <span className="tooltip" aria-hidden="true">
          Delete
        </span>
      </button>
    </div>
  );
}
