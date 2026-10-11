import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/contact-form';
import { Icon } from '@/components/icon';
import { COPY } from '@/lib/copy';
import { getProfileOrFallback } from '@/lib/profile';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Send December Scribbles a note, a collaboration idea or a commission request.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const profile = await getProfileOrFallback();
  return (
    <div className="container-page pt-2 pb-[var(--spacing-section)] sm:pt-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="flex flex-col rounded-[var(--radius-xl)] bg-forest p-6 text-on-dark sm:p-10 lg:col-span-5 lg:p-12">
          <p className="kicker text-on-dark-2 before:bg-blush motion-safe:animate-rise">
            Say hello
          </p>
          <h1 className="mt-5 text-display motion-safe:animate-rise [animation-delay:70ms]">
            Write <span className="accent-serif text-blush">in.</span>
          </h1>
          <p className="mt-6 max-w-md text-lead text-on-dark-2 motion-safe:animate-rise [animation-delay:140ms]">
            A thought about a piece, an idea for a collaboration, or a question about a commission.
            Every note is read personally.
          </p>

          <ul className="mt-10 space-y-3 lg:mt-auto lg:pt-12">
            {profile.instagramUrl && (
              <li>
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-[var(--radius-md)] bg-forest-2 p-4 transition-colors hover:bg-forest-2/70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-meta text-on-dark-2">Instagram</span>
                    <span className="block font-medium">{COPY.instagramHandle}</span>
                  </span>
                  <Icon icon={ArrowUpRight} />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            )}
            {profile.contactEmail && (
              <li>
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="flex items-center gap-4 rounded-[var(--radius-md)] bg-forest-2 p-4 transition-colors hover:bg-forest-2/70"
                >
                  <Icon icon={Mail} />
                  <span className="min-w-0 flex-1 break-all font-medium">
                    {profile.contactEmail}
                  </span>
                </a>
              </li>
            )}
            <li className="flex items-start gap-3 px-1 pt-2 text-sm text-on-dark-2">
              <Icon icon={ShieldCheck} size="sm" className="mt-0.5" />
              <span>
                Your details are only used to reply to you.{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-on-dark">
                  Privacy notice
                </Link>
              </span>
            </li>
          </ul>
        </section>

        <section
          aria-label="Contact form"
          className="rounded-[var(--radius-xl)] bg-surface p-6 shadow-[var(--shadow-sm)] ring-1 ring-line sm:p-10 lg:col-span-7 lg:p-12 motion-safe:animate-rise [animation-delay:120ms]"
        >
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
