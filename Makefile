.PHONY: help install dev build start stop restart logs clean db-up db-seed db-studio db-migrate docker-build docker-up docker-down docker-logs docker-clean test lint

# Default target
help:
	@echo ""
	@echo "  Symma Platform - Available Commands"
	@echo "  ===================================="
	@echo ""
	@echo "  Development:"
	@echo "    make install     - Install all dependencies"
	@echo "    make dev         - Start development servers (API + Web)"
	@echo "    make build       - Build all apps for production"
	@echo "    make test        - Run all tests"
	@echo "    make lint        - Run linting"
	@echo ""
	@echo "  Database:"
	@echo "    make db-up       - Start PostgreSQL container"
	@echo "    make db-seed     - Seed the database"
	@echo "    make db-studio   - Open Prisma Studio"
	@echo "    make db-migrate  - Run Prisma migrations"
	@echo ""
	@echo "  Docker (Full Stack):"
	@echo "    make docker-build  - Build all Docker images"
	@echo "    make docker-up     - Start all containers"
	@echo "    make docker-down   - Stop all containers"
	@echo "    make docker-logs   - View container logs"
	@echo "    make docker-clean  - Remove containers and volumes"
	@echo ""
	@echo "  Quick Start:"
	@echo "    make start       - Start everything (db + dev servers)"
	@echo "    make stop        - Stop everything"
	@echo ""

# ============================================
# Development Commands
# ============================================

install:
	pnpm install

dev:
	@echo "Starting development servers..."
	pnpm dev

build:
	pnpm build

test:
	cd apps/api && pnpm test

lint:
	pnpm lint

# ============================================
# Database Commands
# ============================================

db-up:
	docker-compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3
	@echo "PostgreSQL is running on port 5440"

db-seed:
	cd packages/database && pnpm prisma db seed

db-studio:
	cd packages/database && pnpm prisma studio

db-migrate:
	cd packages/database && pnpm prisma migrate dev

db-generate:
	cd packages/database && pnpm prisma generate

# ============================================
# Docker Commands (Full Stack)
# ============================================

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d
	@echo ""
	@echo "  Services started:"
	@echo "    - Web:      http://localhost:4000"
	@echo "    - API:      http://localhost:4001"
	@echo "    - Database: localhost:5440"
	@echo ""

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-logs-api:
	docker-compose logs -f api

docker-logs-web:
	docker-compose logs -f web

docker-clean:
	docker-compose down -v --rmi local
	@echo "Containers and volumes removed"

docker-restart:
	docker-compose restart

# ============================================
# Quick Start Commands
# ============================================

start: db-up
	@echo "Starting development servers..."
	@sleep 2
	pnpm dev

stop:
	docker-compose stop postgres
	@echo "Services stopped"

restart: stop start

# ============================================
# Code Generation Commands
# ============================================

generate-openapi:
	pnpm run generate:openapi
	@echo "OpenAPI spec generated at apps/api/openapi.json"

generate-kotlin: generate-openapi
	pnpm run generate:kotlin
	@echo "Kotlin models generated at apps/mobile/app/src/main/java/com/symma/app/data/remote/model"

# ============================================
# Utility Commands
# ============================================

clean:
	rm -rf node_modules
	rm -rf apps/api/node_modules apps/api/dist
	rm -rf apps/web/node_modules apps/web/.next
	rm -rf packages/*/node_modules packages/*/dist
	@echo "Cleaned all node_modules and build artifacts"

logs:
	docker-compose logs -f
