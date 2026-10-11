'use client';

import { useEffect, useRef, useState, type ElementType } from 'react';

type State = 'static' | 'hidden' | 'shown';

/**
 * Fades content up as it scrolls into view. Server-rendered content is visible by default;
 * only elements that start below the viewport are hidden, and only after hydration, so
 * nothing is lost without JavaScript or for users who prefer reduced motion.
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already visible

    setState('hidden');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={state === 'static' ? undefined : state}
      style={state === 'shown' && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
