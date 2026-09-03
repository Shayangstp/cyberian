FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN apt-get update \
 && apt-get install --no-install-recommends -y openssl \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN --mount=type=cache,id=pnpm-api,target=/pnpm/store pnpm install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
COPY packages/shared packages/shared
# `pnpm deploy` performs a production install, so restore the generated Prisma
# client from the build workspace after deployment replaces it with a stub.
RUN --mount=type=cache,id=pnpm-api,target=/pnpm/store \
    pnpm --filter @cyberian/shared build \
 && pnpm --filter @cyberian/api db:generate \
 && pnpm --filter @cyberian/api build \
 && pnpm deploy --filter @cyberian/api --prod /runtime \
 && source_client="$(find node_modules/.pnpm -path '*/node_modules/.prisma/client' -type d -print -quit)" \
 && runtime_client="$(find /runtime/node_modules/.pnpm -path '*/node_modules/.prisma/client' -type d -print -quit)" \
 && test -n "$source_client" \
 && test -n "$runtime_client" \
 && rm -rf "$runtime_client" \
 && cp -a "$source_client" "$runtime_client"

FROM base AS runtime
RUN apt-get update \
 && apt-get install --no-install-recommends -y dumb-init \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system app \
 && useradd --system --gid app --create-home app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=app:app /runtime ./
USER app
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
