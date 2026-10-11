import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader } from '@/components/ui';
import { getProfileOrFallback } from '@/lib/profile';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How December Scribbles handles the information you share through this website.',
  alternates: { canonical: '/privacy' },
};

/**
 * Describes what this website's code actually does with personal data.
 * Have it reviewed for your jurisdiction before launch (see docs/LAUNCH-CHECKLIST.md).
 */
export default async function PrivacyPage() {
  const profile = await getProfileOrFallback();
  return (
    <Container className="pb-[var(--spacing-section)]">
      <PageHeader eyebrow="The small print" title="Privacy notice">
        <p>What happens to the details you share through this website.</p>
      </PageHeader>
      <div className="max-w-[var(--container-measure)] space-y-10 pt-12 text-[1.0625rem] leading-[1.8] text-ink-muted [&_h2]:font-display [&_h2]:text-subheading [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <section>
          <h2>What is collected</h2>
          <p>
            Browsing this website does not require an account, and the site does not use advertising
            or analytics cookies. When you send a message through the{' '}
            <Link href="/contact" className="text-rose underline underline-offset-4">
              contact form
            </Link>
            , the following is stored:
          </p>
          <ul>
            <li>your name and email address,</li>
            <li>the type of enquiry, subject and message you wrote,</li>
            <li>the date and time it was sent.</li>
          </ul>
        </section>
        <section>
          <h2>How it is used</h2>
          <p>
            Your message is used only to read and reply to your enquiry. A copy is sent by email to{' '}
            {profile.displayName} so it can be answered. It is never sold or shared for marketing.
          </p>
        </section>
        <section>
          <h2>How long it is kept</h2>
          <p>
            Messages are kept only as long as needed to handle your enquiry and are deleted on
            request.
          </p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>
            You can ask for a copy of your message or for it to be deleted at any time by getting in
            touch through the contact form
            {profile.contactEmail ? (
              <>
                {' '}
                or at{' '}
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="text-rose underline underline-offset-4"
                >
                  {profile.contactEmail}
                </a>
              </>
            ) : null}
            .
          </p>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>
            The only cookie this site sets is a strictly necessary sign-in cookie for the
            site&apos;s administrators. Visitors receive no cookies.
          </p>
        </section>
      </div>
    </Container>
  );
}
