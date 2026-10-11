# Deployment

**Step-by-step AWS guide:** [DEPLOY-AWS.md](DEPLOY-AWS.md) (the recommended setup, with ready-made files in `deploy/aws/`).

The site is two services plus managed backing services:

| Component            | Suggested hosting                                                | Notes                                                                |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| Website (`apps/web`) | Any Node/Docker host (Render, Fly.io, Railway, a VPS), or Vercel | Must reach the API on a private URL                                  |
| API (`apps/api`)     | Same platform as the website, single instance                    | In-memory rate limits assume one instance (see below)                |
| PostgreSQL 15+       | Managed (Neon, Supabase, RDS, platform add-on)                   | Enable automated backups                                             |
| Object storage       | AWS S3 or Cloudflare R2, ideally with a CDN                      | Public **read** on the media bucket. Writes only via API credentials |
| SMTP                 | Postmark, Resend, SES, Brevo...                                  | For enquiry notifications. Optional                                  |

Both apps have production Dockerfiles (build context: repository root):

```bash
docker build -f apps/api/Dockerfile -t ds-api .
docker build -f apps/web/Dockerfile --build-arg API_INTERNAL_URL=https://api.internal:4000 \
  --build-arg SITE_URL=https://decemberscribbles.example -t ds-web .
```

## Configuration

Secrets belong in the hosting platform's secret store, never in the repository.
`.env.example` files list every variable.

### API

| Variable                                                              | Required              | Example / notes                                                                  |
| --------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                                                            | yes                   | `production` (turns on Secure cookies, turns off Swagger)                        |
| `PORT`                                                                | no                    | `4000`                                                                           |
| `DATABASE_URL`                                                        | yes                   | `postgresql://user:pass@host:5432/db?schema=public&sslmode=require`              |
| `FRONTEND_ORIGINS`                                                    | yes                   | `https://decemberscribbles.example` (comma-separate several)                     |
| `TRUST_PROXY_HOPS`                                                    | yes behind a proxy/LB | `1`, so rate limits see real client IPs                                          |
| `SESSION_TTL_HOURS`                                                   | no                    | `168`                                                                            |
| `S3_ENDPOINT`                                                         | R2/other only         | `https://<account>.r2.cloudflarestorage.com` (omit for AWS)                      |
| `S3_REGION` / `S3_BUCKET`                                             | yes                   | `auto` (R2) or AWS region / bucket name                                          |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`                           | yes                   | Key limited to Put/Delete/Head on this bucket                                    |
| `S3_FORCE_PATH_STYLE`                                                 | no                    | `false` for AWS/R2                                                               |
| `MEDIA_PUBLIC_BASE_URL`                                               | yes                   | Public URL serving the bucket, e.g. `https://media.decemberscribbles.example`    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | for email             | Provider SMTP settings                                                           |
| `MAIL_FROM`                                                           | for email             | `December Scribbles <no-reply@your-domain>`, a sender verified with the provider |
| `ENQUIRY_NOTIFY_TO`                                                   | for email             | Owner's inbox                                                                    |
| `LOG_LEVEL`                                                           | no                    | `info`                                                                           |

### Website

| Variable                   | Required                      | Notes                                                              |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `API_INTERNAL_URL`         | yes, **at build and runtime** | Private API URL. The `/api/*` rewrite is compiled in at build time |
| `SITE_URL`                 | yes                           | Public site URL (canonical links, sitemap, Open Graph)             |
| `NEXT_PUBLIC_API_BASE_URL` | no                            | Defaults to `/api/v1`                                              |

Serve both behind HTTPS. Browsers only ever talk to the website's origin. The API can stay
private, or be public if you want Swagger reachable (keep `SWAGGER_ENABLED` unset in production).

## Release procedure

1. CI must be green: lint, type check, unit tests, build, API integration tests, browser tests.
2. **Back up the database** (or confirm a recent automated backup).
3. Apply migrations as a release step, before the new API version takes traffic:
   `npx prisma migrate deploy` (in the API image: `docker run --rm --env-file ... ds-api npx prisma migrate deploy`).
   The local `docker compose --profile app` setup shows this as the `migrate` service.
4. Deploy the API, wait for `GET /api/v1/health/ready` to return 200, then deploy the website.
5. Smoke test: home page, one writing page, contact form (check the owner email), studio login.

First deployment only: run the seed (`npm run prisma:seed -w @ds/api`) and create the owner's
account (`npm run admin:create -w @ds/api -- --email ...`) from a machine or one-off container
with production `DATABASE_URL`.

## Rollback

- **Code**: redeploy the previous image tag. Both apps are stateless.
- **Database**: migrations are forward-only. Write new migrations to be backward compatible
  (add columns and tables first, remove them in a later release), so the previous API version
  still runs after a rollback. Restore from backup only for data-destroying mistakes.
- **Media**: objects are immutable and keyed by UUID. Deleting a media record removes its objects
  (best effort). Enable bucket versioning if you want undo for media deletions.

## Operations

- **Health**: `/api/v1/health` (liveness), `/api/v1/health/ready` (readiness, checks the database).
  Docker images include `HEALTHCHECK`s.
- **Logs**: the API writes JSON lines (pino) with `req.id`. Clients receive the same id in the
  `X-Request-Id` header and in error bodies (`requestId`), so a visitor's error can be matched to
  server logs. Cookies, authorisation headers and passwords are redacted.
- **Email failures**: enquiries are always saved. A failed notification is recorded on the
  enquiry and shown in the studio ("The email notification for this message was not sent").
- **Rate limits** are in-memory per API instance (enquiries 5/10 min, login 5/min, general 120/min).
  If you scale the API horizontally, configure a shared store (e.g. Redis) for `@nestjs/throttler`.
- **Sessions**: expired sessions are cleaned up on each user's next login. A periodic
  `DELETE FROM "Session" WHERE "expiresAt" < now()` is optional housekeeping.
- **Dependencies**: run `npm audit --omit=dev` regularly. Remaining advisories at handover are
  listed in [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).
