'use client';

import { LIMITS, type MediaAsset } from '@ds/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { AdminEmpty } from './admin-ui';
import { useFeedback } from './feedback';
import { Icon } from './icons';
import { UploadForm } from './upload-form';

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ items }: { items: MediaAsset[] }) {
  const router = useRouter();
  const { toast } = useFeedback();
  return (
    <div className="space-y-8">
      <section
        aria-labelledby="upload-title"
        className="rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6"
      >
        <h2 id="upload-title" className="mb-4 flex items-center gap-2 font-semibold">
          <Icon.upload className="h-4 w-4" /> Upload an image
        </h2>
        <UploadForm
          onUploaded={(m) => {
            toast(`Uploaded “${m.originalName}”.`);
            router.refresh();
          }}
        />
      </section>
      {items.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <AdminEmpty title="No images yet" icon="media">
          Uploaded images appear here, ready to use as covers or artwork.
        </AdminEmpty>
      )}
    </div>
  );
}

function MediaCard({ item }: { item: MediaAsset }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [alt, setAlt] = useState(item.alt);
  const [busy, setBusy] = useState(false);
  const inUse = item.usageCount > 0;

  const saveAlt = async () => {
    setBusy(true);
    try {
      await apiRequest(`/admin/media/${item.id}`, { method: 'PATCH', json: { altText: alt } });
      // Cover images on writing and the About image use the library alt text.
      await refreshPublicSite(['content', 'profile']);
      toast('Alt text saved.');
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this image?',
      body: `“${item.originalName}” will be permanently deleted from storage.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/media/${item.id}`, { method: 'DELETE' });
      toast('Image deleted.');
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(false);
    }
  };

  return (
    <li className="flex min-w-0 flex-col rounded-[var(--radius-lg)] border border-line bg-surface">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-[4/3] items-center justify-center bg-sunk p-3"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
        <img
          src={item.thumbnailUrl}
          alt={item.alt || item.originalName}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
        <span className="sr-only"> (open full size in a new tab)</span>
      </a>
      <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate font-medium" title={item.originalName}>
            {item.originalName}
          </p>
          <span className={`shrink-0 text-xs ${inUse ? 'text-success' : 'text-ink-subtle'}`}>
            {inUse ? `In use ×${item.usageCount}` : 'Unused'}
          </span>
        </div>
        <p className="-mt-2 text-xs text-ink-subtle tabular-nums">
          {item.width}×{item.height} · {formatBytes(item.sizeBytes)}
        </p>
        <div>
          <label htmlFor={`alt-${item.id}`} className="field-label flex items-center gap-1.5">
            Alt text
            {!item.alt.trim() && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-warning">
                <Icon.warning className="h-3.5 w-3.5" /> missing
              </span>
            )}
          </label>
          <textarea
            id={`alt-${item.id}`}
            className="field-input min-h-16 text-sm"
            value={alt}
            maxLength={LIMITS.altTextMax}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe what the image shows"
          />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            className="btn btn-ghost min-h-9 px-3 py-1 text-sm"
            disabled={busy || alt === item.alt}
            onClick={saveAlt}
          >
            Save alt text
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-ink-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || inUse}
            title={inUse ? 'Used by writing, artwork or the About section' : undefined}
            onClick={remove}
          >
            <Icon.trash className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </li>
  );
}
