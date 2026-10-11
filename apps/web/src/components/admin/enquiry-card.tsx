'use client';

import { ENQUIRY_TYPE_LABELS, type AdminEnquiry, type EnquiryStatus } from '@ds/contracts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { userMessage } from '@/lib/api/errors';
import { formatDateTime, StatusBadge } from './admin-ui';
import { useFeedback } from './feedback';
import { Icon } from './icons';

export function EnquiryCard({ enquiry }: { enquiry: AdminEnquiry }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: EnquiryStatus, quiet = false) => {
    setBusy(true);
    try {
      await apiRequest(`/admin/enquiries/${enquiry.id}`, { method: 'PATCH', json: { status } });
      if (!quiet)
        toast(
          status === 'ARCHIVED'
            ? 'Archived.'
            : status === 'READ'
              ? 'Marked as read.'
              : 'Marked as unread.',
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
      title: `Delete the message from ${enquiry.name}?`,
      body: 'Use this for data-deletion requests. The message cannot be recovered.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await apiRequest(`/admin/enquiries/${enquiry.id}`, { method: 'DELETE' });
      toast('Message deleted.');
      router.refresh();
    } catch (e) {
      toast(userMessage(e), 'error');
      setBusy(false);
    }
  };

  const replySubject = `Re: ${enquiry.subject ?? ENQUIRY_TYPE_LABELS[enquiry.type]}`;
  const action =
    'inline-flex min-h-9 items-center px-3 text-sm text-ink-muted hover:bg-sunk hover:text-ink disabled:opacity-50';

  return (
    <li
      className={`rounded-[var(--radius-lg)] border bg-surface ${enquiry.status === 'NEW' ? 'border-ink' : 'border-line'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <p className="font-medium">
            {enquiry.name}{' '}
            <span className="font-normal text-ink-muted">&lt;{enquiry.email}&gt;</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {ENQUIRY_TYPE_LABELS[enquiry.type]}
            {enquiry.subject && <> · {enquiry.subject}</>} · {formatDateTime(enquiry.createdAt)}
          </p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>
      <p className="px-5 py-4 text-[0.9375rem] whitespace-pre-line">{enquiry.message}</p>
      {!enquiry.notifiedAt && (
        <p className="flex items-center gap-1.5 px-5 pb-3 text-xs text-warning">
          <Icon.warning className="h-3.5 w-3.5" /> The email notification for this message was not
          sent.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1 border-t border-line px-3 py-2">
        <a
          href={`mailto:${enquiry.email}?subject=${encodeURIComponent(replySubject)}`}
          className="btn btn-primary mr-2 min-h-9 px-4 py-1 text-sm"
          onClick={() => enquiry.status === 'NEW' && void setStatus('READ', true)}
        >
          Reply by email
        </a>
        {enquiry.status !== 'READ' && (
          <button
            type="button"
            className={action}
            disabled={busy}
            onClick={() => setStatus('READ')}
          >
            Mark read
          </button>
        )}
        {enquiry.status !== 'ARCHIVED' && (
          <button
            type="button"
            className={action}
            disabled={busy}
            onClick={() => setStatus('ARCHIVED')}
          >
            Archive
          </button>
        )}
        {enquiry.status !== 'NEW' && (
          <button type="button" className={action} disabled={busy} onClick={() => setStatus('NEW')}>
            Mark unread
          </button>
        )}
        <button
          type="button"
          className={`${action} ml-auto hover:text-danger`}
          disabled={busy}
          onClick={remove}
          aria-label={`Delete the message from ${enquiry.name}`}
        >
          <Icon.trash className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
