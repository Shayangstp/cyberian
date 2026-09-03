FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN --mount=type=cache,id=pnpm-api,target=/pnpm/store pnpm install --frozen-lockfile

FROM dependencies AS build
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @cyberian/shared build \
 && pnpm --filter @cyberian/api db:generate \
 && pnpm --filter @cyberian/api build \
 && pnpm deploy --filter @cyberian/api --prod /runtime

FROM node:22-bookworm-slim AS runtime
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
