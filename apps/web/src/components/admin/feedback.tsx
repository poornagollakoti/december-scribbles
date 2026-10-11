'use client';

import clsx from 'clsx';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

/*
 * Studio-wide feedback: toasts (announced politely to screen readers) and a single
 * accessible confirmation dialog (native modal <dialog>, focus trapped, Escape cancels).
 */

type Tone = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}
interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
}

interface FeedbackApi {
  toast: (message: string, tone?: Tone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, tone, message }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      tone === 'error' ? 7000 : 4000,
    );
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setPending(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (pending) dialogRef.current?.showModal();
  }, [pending]);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    dialogRef.current?.close();
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[var(--z-dialog)] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 border px-4 py-3 text-sm shadow-[var(--shadow-print)] motion-safe:animate-rise',
              t.tone === 'error'
                ? 'border-danger/40 bg-surface text-danger'
                : 'border-line bg-ink text-paper',
            )}
          >
            {t.tone === 'error' ? (
              <Icon.warning className="mt-px h-4 w-4 shrink-0" />
            ) : (
              <Icon.check className="mt-px h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        aria-describedby={pending?.body ? 'confirm-body' : undefined}
        onClose={() => {
          // Escape or programmatic close without a choice counts as "cancel".
          resolver.current?.(false);
          resolver.current = null;
          setPending(null);
        }}
        className="animated-dialog m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-print)]"
      >
        {pending && (
          <div className="p-6">
            <h2 id="confirm-title" className="font-display text-[1.6rem] leading-tight">
              {pending.title}
            </h2>
            {pending.body && (
              <p id="confirm-body" className="mt-3 text-[0.9375rem] text-ink-muted">
                {pending.body}
              </p>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-ghost min-h-10 py-2"
                onClick={() => settle(false)}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className={clsx(
                  'btn min-h-10 py-2',
                  pending.destructive ? 'bg-danger text-white hover:bg-[#8a2824]' : 'btn-primary',
                )}
                onClick={() => settle(true)}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </FeedbackContext.Provider>
  );
}

/**
 * Warns before leaving a form with unsaved changes: on reload/close (beforeunload) and on
 * in-app link clicks (captured before Next.js handles the navigation).
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const message = 'You have unsaved changes. Leave without saving?';
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a[href]');
      if (!link || link.getAttribute('target') === '_blank' || e.defaultPrevented) return;
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#') || href.startsWith('mailto:')) return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}
