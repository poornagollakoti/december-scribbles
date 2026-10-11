'use client';

import { Check, Link2, Share2 } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';

const noopSubscribe = () => () => {};

/** Copy-link and native share (where the browser supports it). */
export function ShareActions({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  // Native share support is fixed per browser: read it without a hydration mismatch.
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function',
    () => false,
  );

  const url = () => new URL(path, window.location.origin).toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} className="btn btn-ghost btn-sm">
        <Icon icon={copied ? Check : Link2} size="sm" />
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => void navigator.share({ title, url: url() }).catch(() => undefined)}
          className="btn btn-ghost btn-sm"
        >
          <Icon icon={Share2} size="sm" />
          Share
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
