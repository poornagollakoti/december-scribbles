'use client';

import {
  CONTENT_KIND_LABELS,
  CONTENT_KINDS,
  LIMITS,
  type AdminContent,
  type ContentStatus,
  type ContentUpsertRequest,
} from '@ds/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { ApiRequestError, userMessage } from '@/lib/api/errors';
import { contentSchema, emptyToNull, type ContentFormValues } from '@/lib/validation/admin';
import { FormField } from '../form-field';
import { Select } from '../select';
import { StatusBadge } from './admin-ui';
import { useFeedback, useUnsavedChangesWarning } from './feedback';
import { Icon } from './icons';
import { ImagePicker } from './image-picker';

type Cover = { id: string; thumbnailUrl: string; alt: string } | null;

export function ContentEditor({ initial }: { initial?: AdminContent }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [cover, setCover] = useState<Cover>(
    initial?.coverImage
      ? {
          id: initial.coverImage.id,
          thumbnailUrl: initial.coverImage.thumbnailUrl,
          alt: initial.coverImage.alt,
        }
      : null,
  );
  const [busy, setBusy] = useState<null | 'save' | 'status' | 'delete'>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: initial?.title ?? '',
      slug: initial?.slug ?? '',
      kind: initial?.kind ?? 'POEM',
      status: initial?.status ?? 'DRAFT',
      excerpt: initial?.excerpt ?? '',
      body: initial?.body ?? '',
      coverImageId: initial?.coverImage?.id ?? null,
    },
  });
  const [title, body, excerpt, slug, status] = useWatch({
    control,
    name: ['title', 'body', 'excerpt', 'slug', 'status'],
  });
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  useUnsavedChangesWarning(isDirty && busy === null);

  const persist = useCallback(
    async (values: ContentFormValues, nextStatus: ContentStatus) => {
      setFormError(null);
      const payload: ContentUpsertRequest = {
        title: values.title,
        ...(values.slug ? { slug: values.slug } : {}),
        kind: values.kind,
        status: nextStatus,
        excerpt: emptyToNull(values.excerpt),
        body: values.body,
        coverImageId: values.coverImageId,
      };
      try {
        const saved = initial
          ? await apiRequest<AdminContent>(`/admin/content/${initial.id}`, {
              method: 'PATCH',
              json: payload,
            })
          : await apiRequest<AdminContent>('/admin/content', { method: 'POST', json: payload });
        await refreshPublicSite(['content']);
        reset({ ...values, slug: saved.slug, status: saved.status });
        const changedStatus = nextStatus !== (initial?.status ?? 'DRAFT');
        toast(
          nextStatus === 'PUBLISHED'
            ? changedStatus
              ? 'Published. It is live on the site now.'
              : 'Changes saved and live on the site.'
            : nextStatus === 'ARCHIVED'
              ? 'Archived. It is no longer on the site.'
              : changedStatus && initial
                ? 'Unpublished. It is now a draft.'
                : 'Draft saved.',
        );
        if (initial) router.refresh();
        else router.replace(`/admin/writing/${saved.id}`);
      } catch (e) {
        if (e instanceof ApiRequestError) {
          for (const d of e.details)
            setError(d.field as keyof ContentFormValues, { message: d.message });
          if (e.status === 409)
            setError('slug', { message: 'This URL is already used by another piece' });
        }
        setFormError(userMessage(e));
        toast('Not saved. Check the highlighted fields.', 'error');
      }
    },
    [initial, reset, router, setError, toast],
  );

  const run = (kind: 'save' | 'status', nextStatus?: ContentStatus) =>
    handleSubmit(
      async (values) => {
        setBusy(kind);
        await persist(values, nextStatus ?? values.status);
        setBusy(null);
      },
      () => toast('Some fields need attention before saving.', 'error'),
    )();

  // Ctrl/Cmd+S saves without changing the status.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void run('save');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onDelete = async () => {
    if (!initial) return;
    const ok = await confirm({
      title: `Delete “${initial.title}”?`,
      body: 'The piece will be removed from the Studio and the website. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy('delete');
    try {
      await apiRequest(`/admin/content/${initial.id}`, { method: 'DELETE' });
      await refreshPublicSite(['content']);
      reset();
      toast(`“${initial.title}” was deleted.`);
      router.replace('/admin/writing');
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(null);
    }
  };

  const isPublished = (initial?.status ?? 'DRAFT') === 'PUBLISHED';
  const description = (excerpt || body).replace(/\s+/g, ' ').trim().slice(0, 155);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run('save');
      }}
    >
      {/* Action bar */}
      <div className="sticky top-16 z-[5] -mx-4 mb-8 flex flex-wrap items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
          <StatusBadge
            status={initial?.status ?? 'DRAFT'}
            label={initial ? undefined : 'New draft'}
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
        {initial && (
          <Link
            href={isPublished ? `/writing/${initial.slug}` : `/admin/writing/${initial.id}/preview`}
            target={isPublished ? '_blank' : undefined}
            className="btn min-h-10 px-3 py-2 text-sm text-ink-muted hover:bg-sunk hover:text-ink"
          >
            <Icon.eye className="h-4 w-4" />
            {isPublished ? 'View live' : 'Preview'}
          </Link>
        )}
        {isPublished ? (
          <>
            <button
              type="button"
              onClick={() => run('status', 'DRAFT')}
              disabled={busy !== null}
              className="btn btn-ghost min-h-10 py-2 text-sm"
            >
              Unpublish
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
              {busy === 'save' ? 'Saving…' : 'Save draft'}
            </button>
            <button
              type="button"
              onClick={() => run('status', 'PUBLISHED')}
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

      <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
        {/* Writing space */}
        <div className="min-w-0">
          <label htmlFor="cw-title" className="eyebrow">
            Title
          </label>
          <input
            id="cw-title"
            {...register('title')}
            maxLength={LIMITS.titleMax}
            placeholder="Untitled"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? 'cw-title-error' : undefined}
            className="mt-2 w-full border-0 border-b border-line bg-transparent pb-3 font-display text-[clamp(2.2rem,1.6rem+2vw,3.4rem)] leading-tight placeholder:text-ink-subtle/60 focus:border-ink focus:outline-none"
          />
          {errors.title && (
            <p id="cw-title-error" className="field-error">
              {errors.title.message}
            </p>
          )}

          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <label htmlFor="cw-body" className="eyebrow">
                Text
              </label>
              <span className="text-xs text-ink-subtle tabular-nums">
                {words} {words === 1 ? 'word' : 'words'}
              </span>
            </div>
            <textarea
              id="cw-body"
              {...register('body')}
              maxLength={LIMITS.bodyMax}
              placeholder="Write here. Line breaks are kept exactly as typed; leave a blank line between stanzas or paragraphs."
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={errors.body ? 'cw-body-error' : 'cw-body-hint'}
              className="mt-2 min-h-[26rem] w-full resize-y rounded-[var(--radius-lg)] border border-line bg-surface px-5 py-4 font-display text-[1.375rem] leading-[1.6] [field-sizing:content] placeholder:font-sans placeholder:text-base placeholder:text-ink-subtle focus:border-ink focus:outline-none"
            />
            {errors.body ? (
              <p id="cw-body-error" className="field-error">
                {errors.body.message}
              </p>
            ) : (
              <p id="cw-body-hint" className="field-hint">
                Shown exactly as typed. {body.length.toLocaleString()} /{' '}
                {LIMITS.bodyMax.toLocaleString()} characters.
              </p>
            )}
          </div>

          <div className="mt-8">
            <FormField
              label="Excerpt"
              optional
              error={errors.excerpt?.message}
              hint="A line or two shown on the homepage, in lists and in search results."
            >
              <textarea
                className="field-input min-h-24"
                maxLength={LIMITS.excerptMax}
                {...register('excerpt')}
              />
            </FormField>
          </div>
        </div>

        {/* Settings column */}
        <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
          <SidePanel title="Details">
            <div className="space-y-5">
              <FormField label="Type" error={errors.kind?.message}>
                <Select {...register('kind')}>
                  {CONTENT_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {CONTENT_KIND_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="URL slug"
                optional
                error={errors.slug?.message}
                hint={`decemberscribbles…/writing/${slug || 'generated-from-title'}`}
              >
                <input className="field-input" maxLength={LIMITS.slugMax} {...register('slug')} />
              </FormField>
            </div>
          </SidePanel>

          <SidePanel title="Cover image">
            <Controller
              control={control}
              name="coverImageId"
              render={({ field }) => (
                <ImagePicker
                  label="Cover image (optional)"
                  value={cover}
                  onChange={(img) => {
                    setCover(img);
                    field.onChange(img?.id ?? null);
                  }}
                />
              )}
            />
            {cover && !cover.alt && (
              <p className="mt-3 flex items-start gap-2 text-sm text-warning">
                <Icon.warning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This image has no alt text. Add a description in the{' '}
                  <Link href="/admin/media" className="underline">
                    media library
                  </Link>
                  .
                </span>
              </p>
            )}
          </SidePanel>

          <SidePanel title="Search preview">
            <div aria-label="How this piece may appear in search results" className="text-sm">
              <p className="truncate text-xs text-ink-subtle">
                December Scribbles › writing › {slug || '…'}
              </p>
              <p className="mt-1 truncate text-[1.05rem] text-night">
                {title || 'Untitled'} · December Scribbles
              </p>
              <p
                className={clsx(
                  'mt-1 line-clamp-3',
                  description ? 'text-ink-muted' : 'text-ink-subtle italic',
                )}
              >
                {description || 'Add an excerpt to control this description.'}
              </p>
            </div>
          </SidePanel>

          {initial && (
            <SidePanel title="More">
              <div className="flex flex-col gap-2">
                {status !== 'ARCHIVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => run('status', 'ARCHIVED')}
                      disabled={busy !== null}
                      className="btn btn-ghost btn-sm w-full justify-start"
                    >
                      <Icon.archive className="h-4 w-4" /> Archive
                    </button>
                    <p className="field-hint mt-0 mb-1">
                      Hides it from the site; it stays in the Studio.
                    </p>
                  </>
                )}
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={busy !== null}
                  className="btn btn-danger btn-sm w-full justify-start"
                >
                  <Icon.trash className="h-4 w-4" /> Delete permanently
                </button>
              </div>
            </SidePanel>
          )}
        </aside>
      </div>
    </form>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 font-sans text-sm font-semibold">{title}</h2>
      <div className="p-4">{children}</div>
    </section>
  );
}
