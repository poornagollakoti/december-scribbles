'use client';

import { LIMITS, type AdminGalleryItem, type GalleryUpsertRequest } from '@ds/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { ApiRequestError, userMessage } from '@/lib/api/errors';
import { emptyToNull, gallerySchema, type GalleryFormValues } from '@/lib/validation/admin';
import { FormField } from '../form-field';
import { StatusBadge } from './admin-ui';
import { useFeedback, useUnsavedChangesWarning } from './feedback';
import { Icon } from './icons';
import { ImagePicker } from './image-picker';

type Picked = { id: string; thumbnailUrl: string; alt: string } | null;

export function GalleryEditor({
  initial,
  categories,
}: {
  initial?: AdminGalleryItem;
  categories: string[];
}) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const categoryListId = useId();
  const [busy, setBusy] = useState<null | 'save' | 'status' | 'delete'>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [image, setImage] = useState<Picked>(
    initial
      ? { id: initial.image.id, thumbnailUrl: initial.image.thumbnailUrl, alt: initial.altText }
      : null,
  );
  // Large preview uses the full rendition when editing existing artwork.
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.image.url ?? null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: initial?.title ?? '',
      slug: initial?.slug ?? '',
      description: initial?.description ?? '',
      category: initial?.category ?? '',
      imageId: initial?.image.id ?? '',
      altText: initial?.altText ?? '',
      displayOrder: initial?.displayOrder ?? 0,
      isPublished: initial?.isPublished ?? false,
      instagramUrl: initial?.instagramUrl ?? '',
    },
  });
  const [title, altText] = useWatch({ control, name: ['title', 'altText'] });
  useUnsavedChangesWarning(isDirty && busy === null);

  const persist = async (values: GalleryFormValues, kind: 'save' | 'status') => {
    setFormError(null);
    setBusy(kind);
    const payload: GalleryUpsertRequest = {
      title: values.title,
      ...(values.slug ? { slug: values.slug } : {}),
      description: emptyToNull(values.description),
      category: emptyToNull(values.category),
      imageId: values.imageId,
      altText: values.altText,
      displayOrder: values.displayOrder,
      isPublished: values.isPublished,
      instagramUrl: emptyToNull(values.instagramUrl),
    };
    try {
      const saved = initial
        ? await apiRequest<AdminGalleryItem>(`/admin/gallery/${initial.id}`, {
            method: 'PATCH',
            json: payload,
          })
        : await apiRequest<AdminGalleryItem>('/admin/gallery', { method: 'POST', json: payload });
      await refreshPublicSite(['gallery']);
      reset({ ...values, slug: saved.slug });
      toast(
        kind === 'status'
          ? saved.isPublished
            ? 'Published. It is in the gallery now.'
            : 'Hidden from the site.'
          : saved.isPublished
            ? 'Changes saved and live.'
            : 'Saved (hidden from the site).',
      );
      if (initial) router.refresh();
      else router.replace(`/admin/gallery/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        for (const d of e.details)
          setError(d.field as keyof GalleryFormValues, { message: d.message });
        if (e.status === 409)
          setError('slug', { message: 'This URL is already used by another piece' });
      }
      setFormError(userMessage(e));
      toast('Not saved. Check the highlighted fields.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    handleSubmit(
      (v) => persist(v, 'save'),
      () => toast('Some fields need attention before saving.', 'error'),
    )();
  const setPublished = (value: boolean) => {
    setValue('isPublished', value, { shouldDirty: true });
    void handleSubmit(
      (v) => persist({ ...v, isPublished: value }, 'status'),
      () => {
        setValue('isPublished', !value);
        toast('Some fields need attention before publishing.', 'error');
      },
    )();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onDelete = async () => {
    if (!initial) return;
    const ok = await confirm({
      title: `Remove “${initial.title}”?`,
      body: 'It will be taken off the site and out of the Studio. The image stays in the media library.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    setBusy('delete');
    try {
      await apiRequest(`/admin/gallery/${initial.id}`, { method: 'DELETE' });
      await refreshPublicSite(['gallery']);
      reset();
      toast(`“${initial.title}” was removed.`);
      router.replace('/admin/gallery');
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(null);
    }
  };

  const livePublished = initial?.isPublished ?? false;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="sticky top-16 z-[5] -mx-4 mb-8 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
          <StatusBadge
            status={livePublished ? 'VISIBLE' : 'HIDDEN'}
            label={initial ? undefined : 'New, hidden'}
          />
          <span className="text-ink-subtle" aria-live="polite">
            {busy === 'save' || busy === 'status'
              ? 'Saving…'
              : isDirty
                ? 'Unsaved changes'
                : initial
                  ? 'All changes saved'
                  : ''}
          </span>
        </div>
        {initial && livePublished && (
          <a
            href={`/gallery/${initial.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn min-h-10 px-3 py-2 text-sm text-ink-muted hover:bg-sunk hover:text-ink"
          >
            <Icon.external className="h-4 w-4" /> View live
          </a>
        )}
        {livePublished ? (
          <>
            <button
              type="button"
              onClick={() => setPublished(false)}
              disabled={busy !== null}
              className="btn btn-ghost min-h-10 py-2 text-sm"
            >
              Hide
            </button>
            <button
              type="submit"
              disabled={busy !== null || !isDirty}
              className="btn btn-primary min-h-10 py-2 text-sm"
            >
              {busy === 'save' ? 'Updating…' : 'Update'}
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={busy !== null || (!!initial && !isDirty)}
              className="btn btn-ghost min-h-10 py-2 text-sm"
            >
              {busy === 'save' ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setPublished(true)}
              disabled={busy !== null}
              className="btn btn-brand min-h-10 py-2 text-sm"
            >
              {busy === 'status' ? 'Publishing…' : 'Publish'}
            </button>
          </>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="mb-6 border-l-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Artwork first */}
        <div className="lg:col-span-7">
          <div className="flex min-h-[22rem] items-center justify-center border border-line bg-sunk p-6 sm:min-h-[30rem] sm:p-10">
            {previewUrl || image ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image
              <img
                src={previewUrl ?? image!.thumbnailUrl}
                alt={altText || title || 'Selected artwork'}
                className="max-h-[70vh] max-w-full object-contain shadow-[var(--shadow-print)]"
              />
            ) : (
              <p className="max-w-xs text-center text-ink-muted">
                <Icon.artwork className="mx-auto mb-3 h-8 w-8" />
                Choose an image from the library or upload a new one.
              </p>
            )}
          </div>
          <div className="mt-4">
            <Controller
              control={control}
              name="imageId"
              render={({ field, fieldState }) => (
                <div>
                  <ImagePicker
                    label="Image"
                    value={image}
                    invalid={!!fieldState.error}
                    onChange={(img) => {
                      setImage(img);
                      setPreviewUrl(null);
                      field.onChange(img?.id ?? '');
                      if (img?.alt && !getValues('altText')) {
                        setValue('altText', img.alt, { shouldDirty: true });
                      }
                    }}
                  />
                  {fieldState.error && <p className="field-error">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <FormField label="Title" error={errors.title?.message}>
            <input
              className="field-input font-display text-[1.4rem]"
              maxLength={LIMITS.titleMax}
              {...register('title')}
            />
          </FormField>
          <FormField
            label="Alt text"
            error={errors.altText?.message}
            hint="Describe what the artwork shows, including any words written on it. Read aloud by screen readers."
          >
            <textarea
              className="field-input min-h-24"
              maxLength={LIMITS.altTextMax}
              {...register('altText')}
            />
          </FormField>
          <FormField label="Description" optional error={errors.description?.message}>
            <textarea
              className="field-input min-h-24"
              maxLength={LIMITS.descriptionMax}
              {...register('description')}
            />
          </FormField>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Category"
              optional
              error={errors.category?.message}
              hint="e.g. Posters, Doodles"
            >
              <input
                className="field-input"
                list={categoryListId}
                maxLength={LIMITS.categoryMax}
                {...register('category')}
              />
            </FormField>
            <datalist id={categoryListId}>
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <FormField
              label="Display order"
              error={errors.displayOrder?.message}
              hint="Lower numbers come first."
            >
              <input
                className="field-input"
                type="number"
                min={0}
                {...register('displayOrder', { valueAsNumber: true })}
              />
            </FormField>
          </div>
          <FormField
            label="Instagram post"
            optional
            error={errors.instagramUrl?.message}
            hint="Link to the original post, shown on the artwork's page."
          >
            <input
              className="field-input"
              type="url"
              placeholder="https://www.instagram.com/p/…"
              {...register('instagramUrl')}
            />
          </FormField>
          <FormField
            label="URL slug"
            optional
            error={errors.slug?.message}
            hint="Generated from the title if left empty."
          >
            <input className="field-input" maxLength={LIMITS.slugMax} {...register('slug')} />
          </FormField>

          {initial && (
            <div className="border-t border-line pt-5">
              <button
                type="button"
                onClick={onDelete}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 text-sm text-danger underline-offset-4 hover:underline"
              >
                <Icon.trash className="h-4 w-4" /> Remove from the sketchbook
              </button>
            </div>
          )}
          {!initial && (
            <p className="text-sm text-ink-muted">
              New artwork stays hidden until you publish it.{' '}
              <Link href="/admin/media" className="underline">
                Manage images
              </Link>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
