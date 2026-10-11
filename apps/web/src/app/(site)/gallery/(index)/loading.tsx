/** Skeleton for the gallery while the page streams in. */
export default function Loading() {
  return (
    <div className="container-page pb-20" role="status" aria-live="polite">
      <span className="sr-only">Loading the sketchbook…</span>
      <div className="pt-12 pb-10 sm:pt-20">
        <div className="skeleton h-5 w-36" />
        <div className="skeleton mt-5 h-16 w-1/2 max-w-lg" />
      </div>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {[22, 16, 26, 18, 24, 15].map((h, i) => (
          <div
            key={i}
            className="skeleton mb-6 rounded-[var(--radius-lg)]"
            style={{ height: `${h}rem` }}
          />
        ))}
      </div>
    </div>
  );
}
