import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';
import { Logo, Monogram } from '@/components/brand';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string | string[] }>;

/** Only same-site admin paths are allowed as post-login destinations (no open redirect). */
function safeNext(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && /^\/admin(\/[\w\-/]*)?$/.test(v) ? v : '/admin';
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const next = safeNext((await searchParams).next);
  return (
    <main className="grid min-h-dvh p-3 lg:grid-cols-2 lg:gap-3">
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] bg-forest p-12 text-on-dark lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-1/4 -bottom-1/4 h-[70%] w-[70%] rounded-full bg-blush/15 blur-3xl"
        />
        <Logo tone="dark" className="relative h-14 self-start text-on-dark" />
        <div className="relative">
          <p className="font-display text-display">
            The <span className="accent-serif text-blush">studio</span>.
          </p>
          <p className="mt-5 max-w-sm text-lead text-on-dark-2">
            Write, publish and curate the notebook and the sketchbook.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm motion-safe:animate-rise">
          <Monogram className="h-12 w-12 text-forest lg:hidden" />
          <h1 className="mt-4 text-title lg:mt-0">Sign in</h1>
          <p className="mt-2 text-ink-2">Welcome back to the Studio.</p>
          <div className="mt-8">
            <LoginForm next={next} />
          </div>
        </div>
      </section>
    </main>
  );
}
