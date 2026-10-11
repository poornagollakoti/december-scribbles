/**
 * Fixed interface copy for the public site, kept apart from components.
 *
 * Brand statements come from the owner (Studio → Site profile) or from facts confirmed on
 * the Instagram profile: the bio, the handle, the content types (poems, quotes, illustrated
 * posters) and the "Bookworm's Closet" highlight. Lines marked PROVISIONAL describe the work
 * neutrally and should be replaced by the owner's own words when available.
 */
export const COPY = {
  instagramHandle: '@decemberscribbles',

  hero: {
    meta: 'Poems · Quotes · Illustrated posters',
    metaShort: 'Poems · Quotes · Posters',
    primaryCta: 'Read the writing',
    secondaryCta: 'Follow on Instagram',
  },

  intro: {
    eyebrow: 'The notebook',
    // PROVISIONAL: shown only until the owner adds About text.
    fallback:
      'December Scribbles is a notebook kept in public: short poems, quotes and hand-drawn posters about the small things worth slowing down for.',
    indexTitle: 'Read by type',
  },

  featured: {
    eyebrow: 'Writing',
    title: 'Latest from the notebook',
    all: 'All writing',
  },

  gallery: {
    eyebrow: 'Posters & illustrations',
    title: 'From the sketchbook',
    all: 'Explore all',
  },

  instagram: {
    eyebrow: 'On Instagram',
    title: 'Where new scribbles appear first',
    cta: 'Follow',
    note: 'Posters, doodles and reels, usually before they land here.',
  },

  about: {
    eyebrow: 'Behind the scribbles',
    cta: 'Read more about December Scribbles',
  },

  closing: {
    title: 'Something here stayed with you?',
    body: 'Write in with a thought about a piece, a collaboration idea or a commission request. Every note is read.',
    cta: 'Write to December Scribbles',
  },

  empty: {
    writing: {
      title: 'The first pages are still being written.',
      body: 'Poems, quotes and stories will appear here as soon as they are published.',
    },
    gallery: {
      title: 'The sketchbook is still closed.',
      body: 'Illustrated posters and doodles will appear here once they are published.',
    },
  },
} as const;
