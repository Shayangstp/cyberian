FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN --mount=type=cache,id=pnpm-api,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @cyberian/api...

COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @cyberian/api db:generate \
    && pnpm --filter @cyberian/shared build \
    && pnpm --filter @cyberian/api build

EXPOSE 3000
CMD ["pnpm", "--filter", "@cyberian/api", "start"]
