'use client';

/** Last-resort boundary for errors in the root layout itself. Must render its own <html>. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'Georgia, serif',
          background: '#f7f2e8',
          color: '#1c2333',
          padding: '4rem 1rem',
          textAlign: 'center',
        }}
      >
        <h1>December Scribbles is taking a short break</h1>
        <p>Something went wrong while loading the site. Please try again shortly.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: 999,
            border: 0,
            background: '#1c2333',
            color: '#f7f2e8',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
