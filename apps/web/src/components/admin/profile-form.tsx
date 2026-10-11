'use client';

import { LIMITS, type SiteProfile, type SiteProfileUpdateRequest } from '@ds/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { refreshPublicSite } from '@/app/admin/actions';
import { apiRequest } from '@/lib/api/client';
import { ApiRequestError, userMessage } from '@/lib/api/errors';
import { emptyToNull, profileSchema, type ProfileFormValues } from '@/lib/validation/admin';
import { FormField } from '../form-field';
import { useFeedback, useUnsavedChangesWarning } from './feedback';
import { ImagePicker } from './image-picker';

export function ProfileForm({ initial }: { initial: SiteProfile }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [aboutImage, setAboutImage] = useState(
    initial.aboutImage
      ? {
          id: initial.aboutImage.id,
          thumbnailUrl: initial.aboutImage.thumbnailUrl,
          alt: initial.aboutImage.alt,
        }
      : null,
  );
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initial.displayName,
      tagline: initial.tagline,
      aboutBody: initial.aboutBody,
      contactEmail: initial.contactEmail ?? '',
      instagramUrl: initial.instagramUrl ?? '',
      aboutImageId: initial.aboutImage?.id ?? null,
    },
  });

  useUnsavedChangesWarning(isDirty && !isSubmitting);

  const onSubmit = async (values: ProfileFormValues) => {
    const payload: SiteProfileUpdateRequest = {
      displayName: values.displayName,
      tagline: values.tagline,
      aboutBody: values.aboutBody,
      contactEmail: emptyToNull(values.contactEmail),
      instagramUrl: emptyToNull(values.instagramUrl),
      aboutImageId: values.aboutImageId,
    };
    try {
      await apiRequest<SiteProfile>('/admin/site-profile', { method: 'PUT', json: payload });
      await refreshPublicSite(['profile']);
      reset(values);
      toast('Settings saved. The site has been updated.');
      router.refresh();
    } catch (e) {
      if (e instanceof ApiRequestError) {
        for (const d of e.details)
          setError(d.field as keyof ProfileFormValues, { message: d.message });
      }
      toast(userMessage(e), 'error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-2xl space-y-6 rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-8"
    >
      <FormField label="Display name" error={errors.displayName?.message}>
        <input className="field-input" maxLength={LIMITS.titleMax} {...register('displayName')} />
      </FormField>
      <FormField
        label="Tagline"
        error={errors.tagline?.message}
        hint="Shown in the hero, footer and About page."
      >
        <textarea
          className="field-input min-h-20"
          maxLength={LIMITS.excerptMax}
          {...register('tagline')}
        />
      </FormField>
      <FormField
        label="About text"
        optional
        error={errors.aboutBody?.message}
        hint="Plain text. Leave a blank line between paragraphs. The first paragraph also appears on the home page."
      >
        <textarea
          className="field-input min-h-64 leading-relaxed"
          maxLength={LIMITS.bodyMax}
          {...register('aboutBody')}
        />
      </FormField>
      <div>
        <Controller
          control={control}
          name="aboutImageId"
          render={({ field }) => (
            <ImagePicker
              label="About image (optional)"
              value={aboutImage}
              onChange={(img) => {
                setAboutImage(img);
                field.onChange(img?.id ?? null);
              }}
            />
          )}
        />
        <p className="field-hint">
          A portrait, workspace or artwork photo for the About section. Set its alt text in Media.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          label="Public contact email"
          optional
          error={errors.contactEmail?.message}
          hint="Shown on the site. Leave empty to hide."
        >
          <input className="field-input" type="email" {...register('contactEmail')} />
        </FormField>
        <FormField label="Instagram link" optional error={errors.instagramUrl?.message}>
          <input className="field-input" type="url" {...register('instagramUrl')} />
        </FormField>
      </div>
      <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}
