/** Skeleton for the writing index while the page streams in. */
export default function Loading() {
  return (
    <div className="container-page pb-20" role="status" aria-live="polite">
      <span className="sr-only">Loading writing…</span>
      <div className="pt-12 pb-10 sm:pt-20">
        <div className="skeleton h-5 w-28" />
        <div className="skeleton mt-5 h-16 w-2/3 max-w-xl" />
      </div>
      <div className="flex gap-2 pb-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="skeleton h-[min(30rem,60svh)] rounded-[var(--radius-xl)]" />
    </div>
  );
}
