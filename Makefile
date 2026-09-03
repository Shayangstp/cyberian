SHELL := /bin/sh
.DEFAULT_GOAL := help

PNPM ?= pnpm
COMPOSE ?= docker compose

.PHONY: help install setup infra-up infra-down dev dev-api dev-web docker-up docker-down docker-build logs ps migrate data-import search-reindex test lint typecheck build format format-check check clean

help:
	@printf '%s\n' \
		'Usage: make <target>' \
		'' \
		'  install         Install locked workspace dependencies' \
		'  setup           Validate dataset; start infra; migrate, import, and reindex' \
		'  infra-up        Start PostgreSQL and Elasticsearch, waiting for health' \
		'  infra-down      Stop infrastructure (preserves named volumes)' \
		'  dev             Start infrastructure and local API/web watch processes' \
		'  dev-api         Start infrastructure and local API watch process' \
		'  dev-web         Start the local web watch process' \
		'  docker-up       Build and start the complete container stack' \
		'  docker-down     Stop containers (preserves named volumes)' \
		'  docker-build    Build API and web images' \
		'  logs            Follow Compose logs' \
		'  ps              Show Compose service status' \
		'  migrate         Apply committed Prisma migrations' \
		'  data-import     Import the required local dataset' \
		'  search-reindex  Rebuild the Elasticsearch projection' \
		'  format          Format the workspace' \
		'  format-check    Check formatting' \
		'  lint            Run ESLint' \
		'  typecheck       Type-check the workspace' \
		'  test            Run all tests' \
		'  build           Build all applications' \
		'  check           Run format, lint, typecheck, tests, and build' \
		'  clean           Remove dependencies and generated artifacts'

install:
	$(PNPM) install --frozen-lockfile

setup: install
	$(PNPM) run setup

infra-up:
	$(COMPOSE) up -d --wait postgres elasticsearch

infra-down:
	$(COMPOSE) stop postgres elasticsearch

dev: infra-up
	$(PNPM) dev

dev-api: infra-up
	$(PNPM) dev:api

dev-web:
	$(PNPM) dev:web

docker-up:
	$(COMPOSE) up -d --build --wait

docker-down:
	$(COMPOSE) down

docker-build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f --tail=100

ps:
	$(COMPOSE) ps

migrate:
	$(PNPM) db:migrate:deploy

data-import:
	$(PNPM) data:import

search-reindex:
	$(PNPM) search:reindex

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

clean:
	@find . -name .git -prune -o -type d \( \
		-name node_modules -o \
		-name dist -o \
		-name build -o \
		-name coverage -o \
		-name .vite -o \
		-name .cache -o \
		-name .turbo \
	\) -prune -exec rm -rf -- {} +
	@find . -name .git -prune -o -type f \( \
		-name '*.tsbuildinfo' -o \
		-name '.eslintcache' -o \
		-name '*.log' -o \
		-name '*.tmp' -o \
		-name '*.swp' -o \
		-name '.DS_Store' \
	\) -exec rm -f -- {} +
	@printf '%s\n' 'Project dependencies and generated artifacts removed.'
