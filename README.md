# December Scribbles

Website and content studio for [December Scribbles](https://www.instagram.com/decemberscribbles/):
_"Life is nothing without inspirations. And i write what inspires."_

- **Public site**: writing (poetry, quotes, prose, book notes), an illustration gallery, About, and a contact form.
- **Studio** (`/admin`): the owner publishes writing, curates the gallery, manages images, reads
  enquiries and edits the site profile. No code changes needed.

| Part                 | Stack                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`           | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · React Hook Form + Zod |
| `apps/api`           | NestJS 11 · Prisma 6 · PostgreSQL 17 · S3-compatible storage · Nodemailer · Swagger      |
| `packages/contracts` | Shared TypeScript API contract used by both apps                                         |

Docs: [Requirements](docs/REQUIREMENTS.md) · [Architecture](docs/ARCHITECTURE.md) ·
[Design system](docs/DESIGN-SYSTEM.md) · [Assets](docs/ASSETS.md) ·
[Deployment](docs/DEPLOYMENT.md) · [Launch checklist](docs/LAUNCH-CHECKLIST.md) ·
[OpenAPI](docs/openapi.json)

## Quick start (local development)

Prerequisites: **Node.js 24 LTS** (≥ 22.12; see `.nvmrc`) and Docker.

```bash
npm install                      # also builds the shared contracts package
npm run services:up              # PostgreSQL :5433, S3Mock :9090, Mailpit :8025
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run prisma:migrate -w @ds/api    # create tables
npm run prisma:seed -w @ds/api       # site profile from the confirmed brand facts
npm run admin:create -w @ds/api -- --email you@example.com --name "Your Name"   # prompts for a password
npm run dev                      # API http://localhost:4000 · website http://localhost:3000
```

- Website: <http://localhost:3000> · Studio: <http://localhost:3000/admin>
- API docs (Swagger): <http://localhost:4000/api/docs>
- Emails sent locally are captured by Mailpit: <http://localhost:8025>

## Scripts (from the repository root)

| Command                                                       | What it does                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                                                 | API (watch mode) and website together                                            |
| `npm run lint` / `npm run typecheck` / `npm run format:check` | Static checks                                                                    |
| `npm test`                                                    | Unit and component tests (Jest for the API, Vitest for the website)              |
| `npm run test:e2e -w @ds/api`                                 | API integration tests against the **test** database                              |
| `npm run test:e2e -w @ds/web`                                 | Browser tests (Playwright + axe accessibility checks), full stack, test database |
| `npm run build`                                               | Production builds of all packages                                                |
| `npm run preview:load -w @ds/api` / `preview:remove`          | Load / remove labelled **sample** content in the dev database to review layouts  |
| `npm run openapi:export -w @ds/api`                           | Regenerate `docs/openapi.json`                                                   |
| `docker compose --profile app up --build`                     | Run the production containers locally                                            |

Integration and browser tests use the separate `december_scribbles_test` database
(`apps/api/.env.test`) and refuse to run against anything else. Run `npm run build -w @ds/api`
and `npx playwright install chromium` (in `apps/web`) before the first browser test run.

## Repository layout

```
apps/
  api/                 NestJS API
    prisma/            schema, migrations, seed
    scripts/           create-admin, export-openapi, e2e fixtures
    src/common/        filters, guards, decorators, validation, utils
    src/config/        validated environment configuration
    src/modules/       health, auth, users, content, gallery, media, enquiries,
                       notifications, site-profile, dashboard
    test/              integration (e2e) tests
  web/
    src/app/(site)/    public pages
    src/app/admin/     studio (login + panel)
    src/components/    UI components (admin/ for the studio)
    src/lib/           typed API clients, validation schemas, helpers
    e2e/               Playwright tests
packages/contracts/    shared API types and limits
docs/                  requirements, architecture, deployment, OpenAPI
brand-assets/          original brand files (source material, not served)
```
