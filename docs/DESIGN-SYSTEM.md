# Design system (2026)

**Status: provisional.** The direction follows what the public Instagram profile shows
(illustrated minimalist posters, handwritten quotes, the 🌂 in the bio, the "December" name).
Real brand colours and fonts could not be extracted, so the tokens below are a proposal. Change
them in `apps/web/src/app/globals.css` (`@theme`). Components only use the semantic names.

## Direction: "a calm modern studio"

A contemporary product-grade look for a literary brand. The base is a warm canvas with deep
forest immersive panels. Blush and rose accents come from the umbrella. There are big
grotesque headlines, with a serif italic reserved for accents, poems and quotes. Surfaces are
rounded and softly shadowed. The artwork is the most colourful thing on the page, so the
interface stays quiet.

## Colour

| Token                            | Value                             | Role                                  | Contrast                        |
| -------------------------------- | --------------------------------- | ------------------------------------- | ------------------------------- |
| `canvas`                         | `#f5f2ec`                         | Page background                       | n/a                             |
| `surface`                        | `#fcfbf8`                         | Cards, inputs, panels                 | n/a                             |
| `muted`                          | `#ece7de`                         | Recessed areas, image wells           | n/a                             |
| `forest` / `forest-2`            | `#1e3326` / `#2a4433`             | Immersive sections, Studio sidebar    | n/a                             |
| `ink-panel`                      | `#141a16`                         | Footer, lightbox                      | n/a                             |
| `ink`                            | `#16201a`                         | Primary text                          | ≈16:1 on canvas                 |
| `ink-2`                          | `#4e5a52`                         | Secondary text                        | 6.5:1 on canvas                 |
| `ink-3`                          | `#66716a`                         | Metadata                              | 4.6:1 on canvas                 |
| `on-dark` / `on-dark-2`          | `#f5f2ec` / `#c3cdc5`             | Text on forest / ink panels           | `on-dark-2` 7.6:1 on forest     |
| `blush` / `blush-soft`           | `#e9a9b6` / `#f6dfe3`             | Accent on dark (7:1 on forest), tints | Never text on light backgrounds |
| `rose` / `rose-deep`             | `#b0405a` / `#8f2f46`             | Accent text and links on light        | 5:1 on canvas                   |
| `teal`                           | `#2f6e73`                         | Focus ring, secondary accent          | 5.2:1 on canvas                 |
| `line` / `line-strong`           | `#ddd6cb` / `#c4baab`             | Hairlines, control borders            | n/a                             |
| `success` / `warning` / `danger` | `#2f6b4f` / `#8a5a00` / `#b3261e` | Feedback, each with a `-soft` tint    | ≥ 4.5:1 on canvas               |

Legacy names (`paper`, `card`, `sunk`, `brand`, `night`, `pencil`, …) are aliases that map onto
these tokens, so older class names keep working.

## Typography

| Family                  | Use                                                                          | Loaded              |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------- |
| **Bricolage Grotesque** | Display: hero, page titles, section headings, wordmark                       | Variable            |
| **Geist**               | Body copy, interface, labels, prose                                          | Variable            |
| **Instrument Serif**    | Italic accents ("Scribbles", the hero's last word), poems, quotes, drop caps | 400 normal + italic |

Fluid scale (`clamp()`), exposed as Tailwind `text-*` utilities:

| Token             | Range            | Use                         |
| ----------------- | ---------------- | --------------------------- |
| `text-hero`       | 2.9rem → 7.25rem | Home headline only          |
| `text-display`    | 2.6rem → 5.75rem | Page titles                 |
| `text-title`      | 2rem → 3.4rem    | Large section statements    |
| `text-heading`    | 1.5rem → 2.2rem  | Section headings            |
| `text-subheading` | 1.2rem → 1.45rem | Card and list titles        |
| `text-lead`       | 1.1rem → 1.3rem  | Intros, standfirsts         |
| `text-poem`       | 1.35rem → 1.8rem | Poem and quote body (serif) |
| `text-meta`       | 0.875rem         | Dates, metadata             |
| `text-label`      | 0.8125rem        | Kickers, small labels       |

Prose is 1.125rem sans with a `40rem` measure and a rose serif drop cap. Long unbroken strings
wrap (`overflow-wrap: anywhere` on `body`), so pasted URLs never cause horizontal scrolling.

## Layout, space, shape

- Page container: `88rem` max (`.container-page`). Section rhythm uses `.section-y`.
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Verified from 360 to 1920px.
- Radius: `xs` 6, `sm` 10, `md` 14, `lg` 20, `xl` 28 px. Buttons and chips are pills.
- Shadows: `sm` (resting cards), `md` (hover, posters), `lg` (menus, hero image, dialogs).
- Z layers: `raised` 10, `header` 40, `overlay` 50, `dialog` 60, `toast` 70.

## Logo

A DS monogram (a notebook-page D with a handwritten S) beside an outlined wordmark, in primary,
compact and monogram versions, each with light and dark variants. Use `<Logo>`, `<Monogram>` or
`<Wordmark>` from `components/brand.tsx`; never type the name as a logo. Concept, files, clear
space and minimum sizes are in [brand/README.md](brand/README.md).

## Iconography

**Lucide React is the only icon set.** Every icon renders through `components/icon.tsx`
(`size` sm 16 / md 18 / lg 22, stroke 1.75, `absoluteStrokeWidth`, `aria-hidden`). Studio code uses
the same wrapper through the `Icon.*` vocabulary in `components/admin/icons.tsx`.

| Meaning                 | Icon                           | Meaning       | Icon              |
| ----------------------- | ------------------------------ | ------------- | ----------------- |
| Home                    | `House`                        | Edit          | `Pencil`          |
| Writing                 | `BookOpen`                     | Delete        | `Trash2`          |
| Posters & illustrations | `Images`                       | Search        | `Search`          |
| Media                   | `Image`                        | Settings      | `Settings2`       |
| Create                  | `Plus`                         | Account       | `UserRound`       |
| Publish / Draft         | `Send` / `FilePenLine`         | Notifications | `Bell`            |
| Previous / Next         | `ChevronLeft` / `ChevronRight` | Close         | `X`               |
| External link           | `ArrowUpRight`                 | Menu          | `Menu`            |
| Archive                 | `Archive`                      | Overview      | `LayoutDashboard` |

Lucide has no Instagram glyph. Instagram links use the word plus `ArrowUpRight`. Every icon-only
control has an `aria-label`, and Studio icon buttons also show a visible tooltip.

## Motion

- Easing `--ease-soft`, with `--ease-snap` for small pops. Durations: 150 / 280 / 700 ms.
- Hero and page titles rise in once. Below-the-fold sections fade up (`[data-reveal]`), are
  never hidden without JavaScript, and print normally.
- Hover: cards lift (shadow), arrows slide, images scale by 3%.
- Dialogs (mobile menu, lightbox, confirms, image picker) use native `<dialog>` with
  `@starting-style` transitions.
- `prefers-reduced-motion: reduce` disables all of it.

## Components

| Component              | File / class                                                                    | Notes                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Buttons                | `.btn` + `primary`/`brand`/`blush`/`ghost`/`quiet`/`on-dark`/`danger`, `btn-sm` | Pills, visible focus ring, disabled state                                             |
| Icon buttons, tooltips | `.icon-btn`, `.has-tooltip` + `.tooltip`(`-right`)                              | 36–44px targets                                                                       |
| Chips / filters        | `.chip`, `.chip-count`                                                          | `aria-current="page"` or `aria-pressed` gives the active state                        |
| Forms                  | `form-field.tsx`, `select.tsx`, `.field-*`                                      | Labels, hints and errors linked with `aria-describedby`                               |
| Header, mobile menu    | `site-header.tsx`, `nav-link.tsx`, `mobile-menu.tsx`                            | Sticky blurred header, segmented nav; full-screen forest menu                         |
| Footer                 | `site-footer.tsx`                                                               | Ink panel with a large wordmark                                                       |
| Headings, states       | `components/ui.tsx`                                                             | `SectionHeading`, `PageHeader` (with count), `EmptyState`, `Pagination`, `FilterTabs` |
| Carousel               | `carousel.tsx`                                                                  | See below                                                                             |
| Writing                | `writing-index.tsx`, `writing-body.tsx`, `share-actions.tsx`                    | Lead card, index rows, poem/quote/prose typesetting, copy/share                       |
| Artwork                | `artwork-gallery.tsx`, `artwork-lightbox.tsx`                                   | Masonry, never cropped; keyboard lightbox                                             |
| Loading                | `.skeleton`, `writing/(index)/loading.tsx`, `gallery/(index)/loading.tsx`       | Scoped to index pages so detail 404s keep a real 404 status                           |

## Homepage content architecture

Each content type has exactly **one** homepage feed, and each feed makes one request:

| Content                 | Section                      | Behaviour                                                                     |
| ----------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Writing                 | **Latest from the notebook** | Carousel of image-well cards. Pieces without a cover get a typographic cover. |
| Posters & illustrations | **From the sketchbook**      | Dark carousel. Artwork keeps its natural proportions at a shared height.      |

The hero never shows posts. It pairs the brand statement with the brand illustration
(`public/brand/hero-illustration.svg`), so every piece stays in its own section and appears once.
A Playwright test asserts that no writing or artwork link appears twice.

**Carousel**: native scroll-snap, previous/next buttons that page by one viewport and disable at
the ends, a progress bar, and `aria-roledescription="carousel"`/`"slide"`. Fewer than 3 items
render as a static row.

## Studio (admin) design

- **Shell**: dark forest sidebar rail grouped Content / Inbox / Site, with an enquiries badge. It
  collapses to icons with tooltips. Mobile uses a drawer `<dialog>`. The top bar has breadcrumbs,
  a **Create** menu and an account menu.
- **Overview**: header actions, a stats strip, "Recently updated" and "Waiting to be published".
  Panels are de-boxed: a heading over a hairline.
- **Writing**: status tabs with counts, type chips, search, rows with a Publish/Unpublish button
  plus Edit / View / Preview / Delete icon buttons. The editor's side panel has Archive and
  Delete as full-width buttons.
- **Posters & Illustrations**: image-led grid, status tabs, category and sort chips, search, a
  publish switch per card.
- **Media**: drag-and-drop upload with preview and alt text; missing alt text is flagged.
- Feedback: `aria-live` toasts, confirmation dialogs for destructive actions, unsaved-changes
  guard, Ctrl/⌘+S. Status is always shown as a dot plus a word.
