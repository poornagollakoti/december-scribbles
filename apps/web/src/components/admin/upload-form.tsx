'use client';

import { LIMITS, UPLOAD_MIME_TYPES, type MediaAsset } from '@ds/contracts';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { Icon } from './icons';

const MAX_MB = LIMITS.uploadMaxBytes / (1024 * 1024);

function validate(file: File): string | null {
  if (!(UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'Only JPEG, PNG, WebP and GIF images can be uploaded.';
  }
  if (file.size > LIMITS.uploadMaxBytes) return `Images must be ${MAX_MB} MB or smaller.`;
  return null;
}

/**
 * Drop zone + alt text. The native file input stays in the DOM (keyboard and screen-reader
 * accessible); dropping a file simply fills it. The API validates the file contents.
 * Not a <form>: it is nested inside other forms (e.g. the image picker in an editor).
 */
export function UploadForm({ onUploaded }: { onUploaded: (media: MediaAsset) => void }) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Object URLs are created when a file is chosen; release the last one on unmount.
  const previewRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );
  const showPreview = (url: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  };

  const choose = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    const problem = validate(f);
    if (problem) {
      setError(problem);
      return;
    }
    setFile(f);
    showPreview(URL.createObjectURL(f));
  };

  const clear = () => {
    setFile(null);
    showPreview(null);
    setAlt('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (!file) return setError('Choose an image file first.');
    const form = new FormData();
    form.append('file', file);
    if (alt.trim()) form.append('altText', alt.trim());
    setBusy(true);
    setError(null);
    try {
      const media = await apiRequest<MediaAsset>('/admin/media', {
        method: 'POST',
        formData: form,
      });
      clear();
      onUploaded(media);
    } catch (e) {
      setError(userMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <input
          id={`${id}-file`}
          ref={fileRef}
          type="file"
          accept={UPLOAD_MIME_TYPES.join(',')}
          className="peer sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <label
          htmlFor={`${id}-file`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped && fileRef.current) {
              const dt = new DataTransfer();
              dt.items.add(dropped);
              fileRef.current.files = dt.files;
            }
            choose(dropped);
          }}
          className={clsx(
            'flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed p-5 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal',
            dragging ? 'border-teal bg-teal/5' : 'border-line-strong bg-canvas hover:border-ink-3',
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
            <img
              src={preview}
              alt=""
              className="max-h-32 max-w-full rounded-[var(--radius-sm)] object-contain shadow-[var(--shadow-sm)]"
            />
          ) : (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-2 shadow-[var(--shadow-sm)]">
              <Icon.upload />
            </span>
          )}
          <span className="text-sm">
            {file ? (
              <span className="font-medium break-all">{file.name}</span>
            ) : (
              <>
                <span className="font-medium">Drop an image here</span> or{' '}
                <span className="text-teal underline underline-offset-4">browse</span>
              </>
            )}
          </span>
          <span className="text-xs text-ink-3">JPEG, PNG, WebP or GIF · up to {MAX_MB} MB</span>
        </label>
      </div>

      <div className="flex flex-col">
        <label htmlFor={`${id}-alt`} className="field-label">
          Alt text
        </label>
        <textarea
          id={`${id}-alt`}
          className="field-input min-h-24 flex-1"
          value={alt}
          maxLength={LIMITS.altTextMax}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe what the image shows, including any words written on it."
        />
        <p className="field-hint">Read aloud by screen readers.</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={busy || !file}
          >
            <Icon.upload className="h-4 w-4" />
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          {file && !busy && (
            <button type="button" className="btn btn-quiet btn-sm" onClick={clear}>
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger-soft px-4 py-3 text-sm text-danger md:col-span-2"
        >
          <Icon.warning className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
