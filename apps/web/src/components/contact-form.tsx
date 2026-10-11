'use client';

import {
  ENQUIRY_TYPE_LABELS,
  ENQUIRY_TYPES,
  LIMITS,
  type CreateEnquiryRequest,
  type EnquiryReceipt,
} from '@ds/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleAlert, CircleCheck, LoaderCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { apiRequest } from '@/lib/api/client';
import { ApiRequestError, userMessage } from '@/lib/api/errors';
import { enquiryDefaults, enquirySchema, type EnquiryFormValues } from '@/lib/validation/enquiry';
import { FormField } from './form-field';
import { Icon } from './icon';
import { Select } from './select';

type Status = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string };

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const statusRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: enquiryDefaults,
    mode: 'onTouched',
  });
  // Move focus to the result so keyboard and screen-reader users hear it.
  useEffect(() => {
    if (status.kind !== 'idle') statusRef.current?.focus();
  }, [status]);

  const messageLength = useWatch({ control, name: 'message' })?.length ?? 0;

  const onSubmit = async (values: EnquiryFormValues) => {
    setStatus({ kind: 'idle' });
    const payload: CreateEnquiryRequest = {
      name: values.name,
      email: values.email,
      type: values.type,
      message: values.message,
      ...(values.subject ? { subject: values.subject } : {}),
      ...(values.website ? { website: values.website } : {}),
    };
    try {
      await apiRequest<EnquiryReceipt>('/enquiries', { method: 'POST', json: payload });
      reset(enquiryDefaults);
      setStatus({ kind: 'success' });
    } catch (error) {
      // Map server-side field errors back onto the form.
      if (error instanceof ApiRequestError && error.details.length) {
        for (const d of error.details) {
          if (d.field in enquiryDefaults) {
            setError(d.field as keyof EnquiryFormValues, { message: d.message });
          }
        }
      }
      setStatus({ kind: 'error', message: userMessage(error) });
    }
  };

  if (status.kind === 'success') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col items-start py-6 focus:outline-none motion-safe:animate-rise"
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon icon={CircleCheck} size="lg" />
        </span>
        <p className="mt-6 font-display text-title">
          Thank <span className="accent-serif text-rose">you.</span>
        </p>
        <p className="mt-3 text-lead text-ink-2">
          Your message has been received. You&apos;ll hear back by email.
        </p>
        <button
          type="button"
          className="btn btn-ghost mt-8"
          onClick={() => setStatus({ kind: 'idle' })}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
      aria-describedby="form-status"
    >
      <div>
        <h2 className="text-heading">Send a note</h2>
        <p className="mt-1.5 text-ink-2">All fields are required unless marked optional.</p>
      </div>
      <div
        ref={statusRef}
        tabIndex={-1}
        id="form-status"
        aria-live="polite"
        className="focus:outline-none"
      >
        {status.kind === 'error' && (
          <p
            role="alert"
            className="flex items-start gap-3 rounded-[var(--radius-md)] bg-danger-soft px-4 py-3 text-[0.9375rem] text-danger"
          >
            <Icon icon={CircleAlert} size="sm" className="mt-0.5" />
            {status.message}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Your name" error={errors.name?.message}>
          <input
            className="field-input"
            autoComplete="name"
            maxLength={LIMITS.nameMax}
            {...register('name')}
          />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input
            className="field-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={LIMITS.emailMax}
            {...register('email')}
          />
        </FormField>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="What is it about?" error={errors.type?.message}>
          <Select {...register('type')}>
            {ENQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENQUIRY_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Subject" optional error={errors.subject?.message}>
          <input className="field-input" maxLength={LIMITS.subjectMax} {...register('subject')} />
        </FormField>
      </div>

      <FormField
        label="Message"
        error={errors.message?.message}
        hint={`${messageLength.toLocaleString()} / ${LIMITS.messageMax.toLocaleString()} characters`}
      >
        <textarea
          className="field-input min-h-44 resize-y"
          maxLength={LIMITS.messageMax}
          {...register('message')}
        />
      </FormField>

      {/* Honeypot: visually hidden and skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <div className="flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
        <p className="text-sm text-ink-3">You&apos;ll get a reply by email.</p>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          <Icon
            icon={isSubmitting ? LoaderCircle : Send}
            size="sm"
            className={isSubmitting ? 'motion-safe:animate-spin' : undefined}
          />
          {isSubmitting ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
