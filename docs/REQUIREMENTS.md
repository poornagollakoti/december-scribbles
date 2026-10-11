# December Scribbles — Requirements

_Phase 1 output: brand discovery, scope, sitemap, journeys and backlog._

## 1. Brand discovery

Source: the public Instagram profile [@decemberscribbles](https://www.instagram.com/decemberscribbles/),
reviewed on 2026-10-11. No other brand assets were available at the time of writing.

### Confirmed (observed on the profile)

| Item          | Finding                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------- |
| Name          | December Scribbles (`@decemberscribbles`)                                                      |
| Bio           | "Life is nothing without inspirations. And i write what inspires🌂."                           |
| Audience size | ~2.3k followers                                                                                |
| Content       | Inspirational quotes, poetry and short writing, set on illustrated posters and cartoons; reels |
| Themes        | Inspiration, motivation, nature, literature and books                                          |
| Highlights    | "stuff like.." and "Bookworm'sCloset"                                                          |
| Commerce      | None. No products, prices, services or shop links                                              |
| Contact       | No email or link in bio                                                                        |

### Assumptions (to confirm with the owner)

- The site is a **personal creative showcase**, not a business. Conversion goals are:
  read the writing, follow on Instagram, and get in touch.
- Writing falls into four types: **Poetry, Quotes, Prose, Bookworm's Closet** (book notes,
  named after the Instagram highlight).
- Enquiry types: General, Collaboration, Commission request, Feedback. "Commission" is offered
  as a contact topic only. No prices or services are advertised.
- Visual identity: the profile's actual colours and typefaces could not be extracted. The design
  system (below) is a proposal built around the literary, wintry "December" theme and the umbrella
  from the bio. All colours live in design tokens and can be changed in one place.

### Decisions made with the owner

| Question               | Decision                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| Scope of first release | Showcase plus an **admin CMS** (owner manages writing, artwork and images) |
| Brand content          | Owner supplies images and text; nothing is invented                        |
| Enquiries              | Stored in the database **and** emailed to the owner                        |

## 2. Sitemap

```
/                    Home: hero, latest writing, gallery preview, Bookworm's Closet*, about teaser*, CTA
/writing             All published writing, filter by type, paginated
/writing/[slug]      A single piece (poem/quote/prose/book note)
/gallery             Published artwork, filter by category*, masonry grid, paginated
/gallery/[slug]      A single artwork
/about               About text from the site profile
/contact             Enquiry form + Instagram/email links
/privacy             Privacy notice for the contact form
/sitemap.xml, /robots.txt, /opengraph-image

/admin/login         Studio sign-in
/admin               Overview: counts, quick actions
/admin/writing       List, filter, search; /new; /[id] edit
/admin/gallery       Grid; /new; /[id] edit
/admin/media         Upload, alt text, delete unused images
/admin/enquiries     Read, mark read/archive, reply by email, delete (ADMIN only)
/admin/profile       Name, tagline, About text, contact links (ADMIN only)
```

`*` shown only when there is content for it. No empty or placeholder sections are shown.

## 3. User journeys and acceptance criteria

**Visitor discovers the writing**

1. Opens the home page and sees the brand name, tagline and the latest writing.
2. Opens Writing, filters by type, opens a poem. Line breaks and stanzas display exactly as written.
3. Unknown or unpublished pages return HTTP 404 with a way back.

**Visitor gets in touch**

1. Opens Contact and fills in name, email, topic and message.
2. Invalid input gets field-level, screen-reader-announced errors, both in the browser and on the server.
3. On success the visitor sees a confirmation. The enquiry is stored and the owner is emailed.
4. If email delivery fails, the visitor still succeeds and the failure is recorded on the enquiry.
5. Abuse controls: a honeypot field plus a rate limit of 5 enquiries per 10 minutes per client.

**Owner publishes**

1. Signs in at `/admin/login`. After 5 failed attempts the account locks for 15 minutes, and logins are rate-limited.
2. Uploads an image. It is validated by decoding, resized, converted to WebP and stripped of metadata.
3. Creates a piece of writing as a draft, then publishes it. It appears on the public site immediately.
4. Adds artwork to the gallery with alt text and display order, and can hide or show it.
5. Reads enquiries, replies by email, archives or deletes them.

**Roles**: `ADMIN` can do everything. `EDITOR` manages writing, gallery and media, but cannot
read enquiries (personal data) or change the site profile.

## 4. Proposed design system

| Token                      | Value                             | Use                                      |
| -------------------------- | --------------------------------- | ---------------------------------------- |
| paper / paper-deep / card  | `#f7f2e8` / `#ede5d5` / `#fffdf8` | Page backgrounds, notebook feel          |
| ink / ink-soft / ink-faint | `#1c2333` / `#4b5468` / `#5f6779` | Text (all AA on paper)                   |
| dusk / frost               | `#26344f` / `#dce5ee`             | December night: footer, accents          |
| rose / rose-deep           | `#a83f55` / `#8a2f44`             | Umbrella accent: CTAs, links, focus ring |
| candle                     | `#c99a3b`                         | Decorative highlights only               |

Typography: **Fraunces** (display), **Source Serif 4** (reading), **Caveat** (handwritten
"scribble" accents), system sans for UI controls. Motifs: ruled-notebook lines, hand-drawn
underline flourishes, the closed umbrella mark, polaroid-style artwork.

## 5. Backlog

| Priority | Item                                                                       | Status                                |
| -------- | -------------------------------------------------------------------------- | ------------------------------------- |
| P0       | Public pages, contact form, admin CMS, media pipeline, email notifications | Done                                  |
| P0       | Owner provides real copy, images, contact email; seed real content         | **Waiting on owner**                  |
| P1       | Confirm brand colours/fonts against real assets; tune tokens               | Waiting on assets                     |
| P1       | Production hosting, domain, SMTP provider, S3/R2 bucket + CDN              | Waiting on owner choice               |
| P2       | Admin user management UI (today: `npm run admin:create`)                   | Not started                           |
| P2       | Password reset by email for admins                                         | Not started                           |
| P2       | Authorised Instagram embeds on writing pages                               | Not started                           |
| P3       | Newsletter / follow-by-email                                               | Not started; needs owner decision     |
| P3       | Shop (prints/books)                                                        | Out of scope; no products exist today |
