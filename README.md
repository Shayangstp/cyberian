# Cyberian

## Project Overview

This repository contains a LinkedIn profile search technical assignment. Card 01 establishes the TypeScript monorepo and application foundations without implementing search or data infrastructure.

## Architecture

- `apps/api` — NestJS REST API with validated configuration and a health endpoint.
- `apps/web` — React and Vite client with routing, query, theme, and error-boundary providers.
- `packages/shared` — intentionally small package for contracts shared between applications.

## Tech Stack

- Node.js 22 and pnpm 9 workspaces
- TypeScript with strict compiler settings
- NestJS and Jest
- React, Vite, Material UI, TanStack Query, React Router, and Vitest
- ESLint and Prettier
- Docker Compose

PostgreSQL and Elasticsearch are planned for later stages; neither is implemented in this foundation.

## Development

Requirements: Node.js 22 and pnpm 9.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The API runs at `http://localhost:3000` and exposes `GET /api/health`. The web client runs at `http://localhost:5173`.

## Commands

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Start the API and web development servers |
| `pnpm dev:api`      | Start only the API                        |
| `pnpm dev:web`      | Start only the web client                 |
| `pnpm build`        | Build all packages and applications       |
| `pnpm lint`         | Lint the workspace                        |
| `pnpm test`         | Run backend and frontend tests            |
| `pnpm typecheck`    | Type-check the workspace                  |
| `pnpm format`       | Format tracked project files              |
| `pnpm format:check` | Check formatting without modifying files  |

## Environment

Configuration is documented in `.env.example`:

- `NODE_ENV` — backend runtime environment.
- `API_PORT` — backend HTTP port.
- `WEB_ORIGIN` — allowed browser origin for CORS.
- `VITE_API_BASE_URL` — backend base URL used by the web client.

## Current Status

This is the project foundation only. Dataset handling, persistence, indexing, profile search, and user-facing search functionality will be implemented in subsequent development stages.
