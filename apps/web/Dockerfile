# December Scribbles website — production image (Next.js standalone output).
# Build from the repository root:
#   docker build -f apps/web/Dockerfile --build-arg API_INTERNAL_URL=http://api:4000 -t ds-web .
# API_INTERNAL_URL is needed at build time (the /api rewrite is compiled in) and at runtime.

FROM node:24.21.0-bookworm-slim AS base
WORKDIR /app

# ---- Build ---------------------------------------------------------------
FROM base AS build
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @ds/web --workspace @ds/contracts --include-workspace-root --ignore-scripts
COPY packages/contracts packages/contracts
COPY apps/web apps/web
ARG API_INTERNAL_URL=http://api:4000
ARG SITE_URL=http://localhost:3000
ENV API_INTERNAL_URL=${API_INTERNAL_URL} SITE_URL=${SITE_URL} NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @ds/contracts && npm run build -w @ds/web

# ---- Runtime -------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
ARG API_INTERNAL_URL=http://api:4000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
