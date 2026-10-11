'use client';

import type { ImageRef, MediaAsset, Paginated } from '@ds/contracts';
import { useCallback, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { UploadForm } from './upload-form';

type Selected = Pick<ImageRef, 'id' | 'thumbnailUrl' | 'alt'> | null;

/**
 * Shows the chosen image and opens a native <dialog> (focus-trapped, Escape closes)
 * to pick from the media library or upload a new image.
 */
export function ImagePicker({
  value,
  onChange,
  label,
  invalid,
}: {
  value: Selected;
  onChange: (image: Selected) => void;
  label: string;
  invalid?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [media, setMedia] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await apiRequest<Paginated<MediaAsset>>('/admin/media', {
        query: { pageSize: 50 },
      });
      setMedia(page.items);
    } catch (e) {
      setError(userMessage(e));
    }
  }, []);

  const open = () => {
    dialogRef.current?.showModal();
    void load();
  };
  const choose = (m: Pick<ImageRef, 'id' | 'thumbnailUrl' | 'alt'>) => {
    onChange({ id: m.id, thumbnailUrl: m.thumbnailUrl, alt: m.alt });
    dialogRef.current?.close();
  };

  return (
    <div>
      <p className="field-label">{label}</p>
      <div
        className={`flex items-center gap-4 rounded-[var(--radius-md)] border bg-surface p-3 ${invalid ? 'border-danger' : 'border-line'}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of a library thumbnail
          <img
            src={value.thumbnailUrl}
            alt={value.alt}
            className="h-20 w-20 rounded-[var(--radius-sm)] object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-xs text-ink-muted">
            No image
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost min-h-10 py-1.5" onClick={open}>
            {value ? 'Change image' : 'Choose image'}
          </button>
          {value && (
            <button
              type="button"
              className="btn min-h-10 py-1.5 text-ink-soft hover:text-danger"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="image-picker-title"
        className="animated-dialog m-auto w-[min(56rem,calc(100vw-2rem))] rounded-[var(--radius-xl)] bg-canvas p-0 font-sans text-ink shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="image-picker-title" className="text-xl font-semibold">
            Choose an image
          </h2>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-paper-deep"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">
          <details className="mb-5 rounded-[var(--radius-md)] border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold">Upload a new image</summary>
            <div className="mt-4">
              <UploadForm onUploaded={(m) => choose(m)} />
            </div>
          </details>
          {error && (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
          {!media && !error && <p className="text-ink-soft">Loading images…</p>}
          {media && media.length === 0 && (
            <p className="text-ink-soft">The library is empty. Upload an image above.</p>
          )}
          {media && media.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {media.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => choose(m)}
                    aria-pressed={value?.id === m.id}
                    className={`block w-full overflow-hidden rounded-[var(--radius-md)] border-2 ${value?.id === m.id ? 'border-rose' : 'border-transparent hover:border-ink'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail grid */}
                    <img
                      src={m.thumbnailUrl}
                      alt={m.alt || m.originalName}
                      className="aspect-square w-full object-cover"
                    />
                    <span className="sr-only">Choose {m.alt || m.originalName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </div>
  );
}
