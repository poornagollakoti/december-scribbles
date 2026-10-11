# December Scribbles API — production image.
# Build from the repository root:  docker build -f apps/api/Dockerfile -t ds-api .
# Run migrations as a release step: docker run --rm --env-file .env ds-api npx prisma migrate deploy

FROM node:24.21.0-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Build ---------------------------------------------------------------
FROM base AS build
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @ds/api --workspace @ds/contracts --include-workspace-root --ignore-scripts
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN npm run build -w @ds/contracts && npm run build -w @ds/api

# ---- Runtime -------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --omit=dev --workspace @ds/api --workspace @ds/contracts --include-workspace-root --ignore-scripts \
  && npm cache clean --force
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/prisma apps/api/prisma
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

WORKDIR /app/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
