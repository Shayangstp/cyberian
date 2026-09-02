SHELL := /bin/sh

.DEFAULT_GOAL := help

PNPM ?= pnpm
COMPOSE ?= docker compose
COMPOSE_ENV = $(if $(POSTGRES_PORT),POSTGRES_PORT=$(POSTGRES_PORT),)
INFRA_SERVICES := postgres
APP_SERVICES := api web

.PHONY: help doctor env install infra-up infra-down infra-restart infra-logs infra-logs-tail ps dev dev-api dev-web setup db-generate db-migrate db-migrate-deploy db-studio data-inspect data-import-dry-run data-import app-up app-logs app-rebuild down format format-check lint typecheck test build check

help:
	@printf '%s\n' \
		'Setup' \
		'  make setup              First-time local setup' \
		'  make doctor             Check required local tools' \
		'  make env                Create .env from .env.example if absent' \
		'  make install            Install locked dependencies' \
		'' \
		'Development' \
		'  make dev                Run infrastructure plus API and web locally' \
		'  make dev-api            Run infrastructure plus the API locally' \
		'  make dev-web            Run the web client locally' \
		'' \
		'Infrastructure' \
		'  make infra-up           Start healthy infrastructure services' \
		'  make infra-down         Stop infrastructure without deleting volumes' \
		'  make infra-restart      Restart infrastructure services' \
		'  make infra-logs         Follow infrastructure logs' \
		'  make ps                 Show Compose service status' \
		'' \
		'Docker application' \
		'  make app-up             Build and run the complete application in Docker' \
		'  make app-logs           Follow application and infrastructure logs' \
		'  make app-rebuild        Rebuild API and web containers' \
		'  make down               Stop and remove Compose containers' \
		'' \
		'Database and data' \
		'  make db-generate        Generate the Prisma client' \
		'  make db-migrate         Apply development migrations' \
		'  make db-migrate-deploy  Apply committed migrations' \
		'  make db-studio          Open Prisma Studio' \
		'  make data-inspect       Inspect dataset metadata safely' \
		'  make data-import-dry-run  Validate an import without writes' \
		'  make data-import        Import normalized profiles idempotently' \
		'' \
		'Quality' \
		'  make format             Format the workspace' \
		'  make format-check       Check formatting' \
		'  make lint               Run ESLint' \
		'  make typecheck          Type-check the workspace' \
		'  make test               Run tests' \
		'  make build              Build applications and packages' \
		'  make check              Run all quality checks'

doctor:
	@status=0; \
	if command -v node >/dev/null 2>&1; then \
		node_version="$$(node --version)"; node_major="$$(printf '%s' "$$node_version" | sed 's/^v//' | cut -d. -f1)"; \
		printf 'Node.js: %s\n' "$$node_version"; \
		if [ "$$node_major" != 22 ]; then printf 'ERROR: Node.js 22 is required.\n'; status=1; fi; \
	else printf 'ERROR: Node.js is required.\n'; status=1; fi; \
	if command -v $(PNPM) >/dev/null 2>&1; then \
		pnpm_version="$$($(PNPM) --version)"; pnpm_major="$$(printf '%s' "$$pnpm_version" | cut -d. -f1)"; \
		printf 'pnpm: %s\n' "$$pnpm_version"; \
		if [ "$$pnpm_major" != 9 ]; then printf 'ERROR: pnpm 9 is required.\n'; status=1; fi; \
	else printf 'ERROR: pnpm 9 is required.\n'; status=1; fi; \
	if command -v docker >/dev/null 2>&1; then \
		printf 'Docker: '; docker --version; \
		if ! docker info >/dev/null 2>&1; then printf 'ERROR: Docker daemon is not reachable. Start Docker and retry.\n'; status=1; fi; \
	else printf 'ERROR: Docker is required.\n'; status=1; fi; \
	if command -v docker >/dev/null 2>&1 && $(COMPOSE) version >/dev/null 2>&1; then printf 'Docker Compose: '; $(COMPOSE) version --short; \
	else printf 'ERROR: Docker Compose (docker compose) is required.\n'; status=1; fi; \
	if command -v make >/dev/null 2>&1; then printf 'Make: '; make --version | sed -n '1p'; else printf 'ERROR: Make is required.\n'; status=1; fi; \
	exit $$status

env:
	@if [ -f .env ]; then printf '.env already exists; leaving it unchanged.\n'; \
	elif [ -f .env.example ]; then cp .env.example .env && printf 'Created .env from .env.example.\n'; \
	else printf 'ERROR: .env.example is missing.\n' >&2; exit 1; fi

install:
	$(PNPM) install --frozen-lockfile

infra-up:
	@set -eu; \
	$(COMPOSE_ENV) $(COMPOSE) up -d $(INFRA_SERVICES); \
	for service in $(INFRA_SERVICES); do \
		id="$$($(COMPOSE_ENV) $(COMPOSE) ps -q "$$service")"; \
		[ -n "$$id" ] || { printf 'ERROR: Compose did not create %s.\n' "$$service" >&2; exit 1; }; \
		deadline=$$(( $$(date +%s) + 60 )); \
		while :; do \
			state="$$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$$id" 2>/dev/null || true)"; \
			case "$$state" in healthy|running) break ;; unhealthy|dead) printf 'ERROR: %s is unhealthy.\n' "$$service" >&2; exit 1 ;; esac; \
			[ $$(date +%s) -lt $$deadline ] || { printf 'ERROR: Timed out waiting for %s.\n' "$$service" >&2; exit 1; }; sleep 2; \
		done; \
	done; \
	$(COMPOSE_ENV) $(COMPOSE) ps

infra-down:
	$(COMPOSE_ENV) $(COMPOSE) stop $(INFRA_SERVICES)

infra-restart:
	$(MAKE) infra-down
	$(MAKE) infra-up

infra-logs:
	$(COMPOSE_ENV) $(COMPOSE) logs -f $(INFRA_SERVICES)

infra-logs-tail:
	$(COMPOSE_ENV) $(COMPOSE) logs --tail=100 $(INFRA_SERVICES)

ps:
	$(COMPOSE_ENV) $(COMPOSE) ps

dev: env infra-up
	$(PNPM) dev

dev-api: env infra-up
	$(PNPM) dev:api

dev-web: env
	$(PNPM) dev:web

setup: doctor env install infra-up db-generate db-migrate
	@printf '\nSetup complete. Run: make dev\n'

db-generate:
	$(PNPM) db:generate

db-migrate:
	$(PNPM) db:migrate

db-migrate-deploy:
	$(PNPM) db:migrate:deploy

db-studio:
	$(PNPM) db:studio

data-inspect:
	$(PNPM) data:inspect

data-import-dry-run:
	$(PNPM) data:import -- --dry-run

data-import:
	$(PNPM) data:import

app-up:
	$(COMPOSE_ENV) $(COMPOSE) up -d --build --wait
	$(COMPOSE_ENV) $(COMPOSE) ps

app-logs:
	$(COMPOSE_ENV) $(COMPOSE) logs -f postgres api web

app-rebuild:
	$(COMPOSE_ENV) $(COMPOSE) up -d --build --force-recreate --wait $(APP_SERVICES)

down:
	$(COMPOSE_ENV) $(COMPOSE) down

format:
	$(PNPM) format

format-check:
	$(PNPM) format:check

lint:
	$(PNPM) lint

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

build:
	$(PNPM) build

check: format-check lint typecheck test build
