# Launch checklist and known limitations

## Needed from the owner before launch

- [ ] **About text, display name confirmation and public contact email.** Enter them in Studio → Site profile.
- [ ] **Real writing and artwork.** Add them in the studio. The site ships with no invented content and
      shows tasteful empty states until content is published.
- [ ] **Brand assets** (logo, profile photo, exported posts) in `brand-assets/`, to confirm or tune
      the colour palette and typography in `apps/web/src/app/globals.css` (`@theme` tokens).
- [ ] Domain name and hosting choice (see [DEPLOYMENT.md](DEPLOYMENT.md)).
- [ ] SMTP provider account and the inbox that should receive enquiries.
- [ ] S3 or R2 bucket (+ CDN/custom domain) for images.
- [ ] Review of the privacy notice (`/privacy`) for your jurisdiction. It describes what the code
      actually does, but it is not legal advice.

## Verified at handover (2026-10-11, 2026 UI transformation)

| Check                                                                                                                 | Result                                             |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Lint (ESLint, type-aware for the API), type check, Prettier                                                           | Pass                                               |
| API unit tests (Jest)                                                                                                 | 37 passed                                          |
| Website unit/component tests (Vitest)                                                                                 | 23 passed                                          |
| API integration tests (real PostgreSQL + S3Mock), incl. publication filtering and Studio filters                      | 42 passed                                          |
| Browser end-to-end tests (Playwright, production build, desktop + mobile)                                             | 20 passed, 1 skipped (mobile-only test on desktop) |
| Homepage: one feed per content type, no duplicated items (automated check)                                            | Pass                                               |
| Studio journeys: publish/unpublish, delete with confirm/cancel, artwork publish switch, enquiries, sign-out           | Pass                                               |
| Accessibility: axe WCAG 2.x A/AA at rest on public pages, Studio overview, writing list/editor, artwork list, dialogs | No serious/critical violations                     |
| No page-level horizontal overflow at 360 / 390 / 768 / 1024 / 1280 / 1920 px (public + Studio)                        | Pass                                               |
| Visual review of every public and Studio route at 1440 and 390 px (screenshots reviewed, issues fixed and rechecked)  | Done                                               |
| Missing writing/artwork pages return HTTP 404 (skeleton loaders scoped to index pages)                                | Pass                                               |
| Production build succeeds without the API reachable                                                                   | Pass                                               |

## Known limitations and follow-ups

- **Node.js version**: the project requires Node ≥ 22.12 (24 LTS recommended).
- **Rate limiting is per process** (in memory). Fine for one API instance. Add Redis if scaling out.
- **No admin user-management UI or password reset by email.** Accounts are created and reset with
  `npm run admin:create -w @ds/api -- --email ...` (re-running it for an existing email resets
  the password and signs out all sessions).
- **Instagram content is not imported automatically.** Pulling posts requires the owner's
  authorised Instagram API access. Scraping is deliberately not used.
- **Prisma 6**: Prisma 7 is available but changes configuration substantially. Plan the upgrade
  separately. It also removes the `deepmerge-ts` advisory below.
- **Remaining `npm audit` advisories** (none critical at runtime):
  - `deepmerge-ts` (high) via the Prisma CLI config loader. It only processes the project's own config file.
  - `braces`, `js-yaml` 3.x, `sprintf-js`: development tooling only (ESLint plugin, Jest coverage).
    No production exposure.
  - `@nestjs/swagger`'s `js-yaml` is pinned to the patched 5.4.3 via `overrides`.
- **Design tokens are a proposal** until checked against the real brand assets (see DESIGN-SYSTEM.md).
- **Instagram**: the site links to the real profile and, per artwork, to original posts the owner
  links in the Studio. There is no automatic feed, which would need the owner's authorised API access.
- **Mobile LCP** is ~3.2–3.6s on Lighthouse's throttled profile with local storage. Serving media
  from a CDN in production should improve it.
