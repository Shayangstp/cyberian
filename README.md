# Cyberian

## Project Overview

This repository contains a LinkedIn profile search technical assignment. PostgreSQL stores the normalized profile data used by the application; search infrastructure remains a future stage.

## Architecture

- `apps/api` — NestJS REST API with validated configuration and a health endpoint.
- `apps/web` — React and Vite client with routing, query, theme, and error-boundary providers.
- `packages/shared` — intentionally small package for contracts shared between applications.

PostgreSQL is the canonical source of truth. The import pipeline writes only a deliberate whitelist of normalized professional profile fields. Elasticsearch will be introduced later as a replaceable search projection, not as the authoritative data store.

## Tech Stack

- Node.js 22 and pnpm 9 workspaces
- TypeScript with strict compiler settings
- NestJS and Jest
- PostgreSQL 16 and Prisma
- Streaming CSV ingestion with `csv-parse`
- React, Vite, Material UI, TanStack Query, React Router, and Vitest
- ESLint and Prettier
- Docker Compose

Elasticsearch is planned for a later stage and is not implemented yet.

## Development

Requirements: Node.js 22, pnpm 9, Make, and Docker with Compose.

For a first-time setup:

```bash
make setup
make dev
```

`make setup` checks local tools, creates the root `.env` when needed, installs locked dependencies, starts PostgreSQL, generates Prisma, and applies development migrations. It does not import the private dataset. `make dev` keeps PostgreSQL in Docker while running the API and web client locally in watch mode; `Ctrl+C` stops those host processes and leaves infrastructure running. Use `make infra-down` to stop PostgreSQL without deleting its volume.

The API runs at `http://localhost:3000` and exposes `GET /api/health`. The web client runs at `http://localhost:5173` (ports are configured in `.env.example`).

Use `make app-up` when the complete API, web client, and infrastructure should run in Docker. Unlike `make dev`, it does not run host watch processes.

## Database and Dataset

Copy the root environment example before running database commands:

```bash
cp .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
```

The private client dataset must be placed at `data/raw/300-user-linkedin.csv`. Files in `data/raw` and generated reports in `data/processed` are ignored by Git and must not be committed.

Inspect the dataset without writing to the database:

```bash
pnpm data:inspect
```

Validate the complete normalization pipeline without database writes:

```bash
pnpm data:import -- --dry-run
```

Run the idempotent import:

```bash
pnpm data:import
```

Rows whose width differs from the CSV header are skipped without shifting columns. Duplicate and repeated records are resolved by a deterministic source key and upserted, so repeated imports do not create duplicate profiles. Console output and `data/processed/import-report.json` contain aggregate counts and reason codes only.

## Source Archive Safety

Create a final source archive only from committed Git files:

```bash
git archive --format=zip --output ../cyberian-source.zip HEAD
```

Do not use a broad command such as `zip -r ... *`: Git-ignored private datasets, generated import reports, and build output can still be included.

The persistence whitelist is limited to LinkedIn identity/URL, names, professional title and role, industry, current company, general location/country, professional summary, inferred years of experience, skills, and sanitized experience/education data. Phone numbers, emails, street/postal addresses, birth data, unrelated social identifiers/usernames, unknown source fields, and complete raw rows are discarded during normalization.

## Commands

| Command           | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `make help`       | List development commands                    |
| `make doctor`     | Check required local tools                   |
| `make env`        | Create `.env` without overwriting it         |
| `make install`    | Install locked dependencies                  |
| `make infra-up`   | Start healthy PostgreSQL                     |
| `make infra-down` | Stop PostgreSQL, preserving its volume       |
| `make infra-logs` | Follow infrastructure logs                   |
| `make dev`        | Run API and web locally with infrastructure  |
| `make dev-api`    | Run only the API locally                     |
| `make dev-web`    | Run only the web client locally              |
| `make app-up`     | Build and run the complete Docker stack      |
| `make app-logs`   | Follow all Compose service logs              |
| `make down`       | Stop and remove Compose containers           |
| `make check`      | Run formatting, lint, typecheck, test, build |

The underlying `pnpm` database, data, quality, and build commands remain available as documented below and are also exposed by corresponding Make targets (`make db-generate`, `make db-migrate`, `make db-migrate-deploy`, `make db-studio`, `make data-inspect`, `make data-import-dry-run`, and `make data-import`).

## Environment

Configuration is documented in `.env.example`:

- `NODE_ENV` — backend runtime environment.
- `API_PORT` — backend HTTP port.
- `WEB_ORIGIN` — allowed browser origin for CORS.
- `DATABASE_URL` — PostgreSQL connection URL used by Prisma.
- `VITE_API_BASE_URL` — backend base URL used by the web client.

## Current Status

Dataset inspection and PostgreSQL persistence are implemented. Indexing, profile search, and user-facing search functionality will be implemented in subsequent development stages.
