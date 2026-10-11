# Architecture

## Overview

```
 Browser ──► Next.js website (apps/web) ──/api/* rewrite──► NestJS API (apps/api) ──► PostgreSQL
    │          Server Components fetch                       │  Prisma ORM
    │          the API server-side                           ├──► S3-compatible storage (images)
    └──────────── images served directly from storage/CDN ◄──┘  └──► SMTP (enquiry notifications)
```

- **apps/web**: Next.js 16 (App Router, React 19, Tailwind CSS 4). Public pages are Server
  Components rendered per request. API responses are cached in the Next.js data cache for
  60 seconds and invalidated immediately (`updateTag`) when an admin saves a change. Client
  Components are used only for interactivity: the contact form, mobile menu and admin editors.
- **apps/api**: NestJS 11 modular monolith exposing a versioned REST API at `/api/v1`, documented
  with Swagger at `/api/docs` (disabled in production by default).
- **packages/contracts**: TypeScript types and constants for every request and response. The API
  services return these types and the web client consumes them, so a contract change fails
  type checking on both sides.

## Key decisions

| Decision                                                               | Rationale                                                                                                                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modular monolith, no microservices                                     | One small site. Module boundaries (content, gallery, media, enquiries, auth...) stay clean for later extraction.                                                                 |
| PostgreSQL + Prisma 6                                                  | Structured data (content, enquiries, users) with relations and migrations. Prisma 6 because Prisma 7 changes configuration significantly; upgrade later.                         |
| Same-origin API via Next.js rewrite                                    | The admin session cookie is first-party with `SameSite=Strict`, so no CORS credentials are needed in production.                                                                 |
| Server-side sessions (opaque token, SHA-256 hash in DB) instead of JWT | Instant revocation (logout, password change), no refresh-token machinery, small attack surface.                                                                                  |
| Writing stored as plain text                                           | Poems need exact line breaks. Plain text rendered by React cannot inject HTML, so no sanitiser is needed.                                                                        |
| Uploads go through the API (not presigned URLs)                        | Every image is decoded and re-encoded by `sharp`: real content validation, metadata stripping, bounded size. Admin-only uploads up to 10 MB don't need direct-to-bucket uploads. |
| Next.js image optimiser disabled                                       | The API already stores optimised WebP renditions (2400px + 640px). It also removes the optimiser's server-side fetching of remote URLs.                                          |
| In-memory rate limiting, no Redis                                      | A single API instance is enough for this site. **If you run several API instances, add a Redis store for `@nestjs/throttler`.**                                                  |
| Public pages rendered per request (`connection()`)                     | Builds never depend on the API being reachable, and the data cache keeps it fast.                                                                                                |

## API modules

| Module          | Responsibility                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| `health`        | Liveness `/health`, readiness `/health/ready` (database check)                  |
| `auth`          | Login, logout, current user; `SessionGuard`                                     |
| `users`         | Admin accounts, Argon2id password hashing (no HTTP endpoints; CLI provisioning) |
| `content`       | Writing: public listing/detail, admin CRUD                                      |
| `gallery`       | Artwork: public listing/detail with categories, admin CRUD                      |
| `media`         | Upload pipeline (sharp → S3), library, alt text, delete-if-unused               |
| `enquiries`     | Public submission (honeypot, rate limit), admin inbox                           |
| `notifications` | SMTP email via nodemailer. Disabled when not configured.                        |
| `site-profile`  | Single-row brand copy: name, tagline, about, links                              |
| `dashboard`     | Admin overview counts                                                           |

Cross-cutting: `AllExceptionsFilter` (uniform `ApiError` body, no leaks), strict global
`ValidationPipe` (unknown fields rejected), `ThrottlerGuard`, `OriginGuard` (CSRF defence),
`RolesGuard`, pino structured logs with redaction and `X-Request-Id` correlation, helmet,
validated configuration (zod), graceful shutdown hooks.

## Data model

See `apps/api/prisma/schema.prisma`. Highlights:

- `Content.slug` and `GalleryItem.slug` are unique. Slugs are generated from titles (`-2`, `-3`... on clashes).
- `MediaAsset` holds only object keys and metadata, never binaries. Content and gallery
  references use `onDelete: Restrict`, so an image in use cannot be deleted (409).
- `Session.tokenHash` is unique. Sessions cascade-delete with their user.
- `SiteProfile` is a single row (`id = 1`).
- Indexes cover the public listing queries (`status, publishedAt`) and the admin inbox (`status, createdAt`).

## Security model

- Passwords: Argon2id (19 MiB, t=2), transparent rehash on login, minimum 12 characters.
- Login: generic error for unknown, locked or inactive accounts, with timing equalised using a
  dummy hash. The account locks for 15 minutes after 5 failures, and login is rate-limited to 5/min per client.
- Session cookie: `HttpOnly`, `SameSite=Strict`, `Secure` in production, 7-day expiry, revocable.
- CSRF: SameSite=Strict, plus `OriginGuard` rejecting unsafe requests from unlisted origins.
- Input: DTO whitelisting, length limits from the shared contract, UUID-validated ids.
- Output: errors never include stack traces or database messages. Logs redact cookies and passwords.
- Uploads: content-decoded validation, a pixel limit against decompression bombs, an allow-list of
  formats, re-encoding, and random object keys.
- Headers: helmet on the API. CSP `frame-ancestors 'none'`, `X-Frame-Options`, HSTS (production),
  `nosniff` and `Referrer-Policy` on the website.
- Authorisation: enquiries and the site profile are `ADMIN`-only. All admin routes require a session.
