# symma-platform Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies
- Kotlin (Android, Min SDK 26 / Target 34), TypeScript (contracts/docs) + Jetpack Compose, Hilt, MediaPipe FaceLandmarker, Kotlin Coroutines/Flow, Retrofit + Gson (001-fix-isometric-calibration)
- Room (local source of truth) + Prisma/PostgreSQL via existing API contracts (no schema migration required for MVP behavior) (001-fix-isometric-calibration)
- Kotlin (JVM 17, Min SDK 26, Target SDK 34) + Room (local DB), WorkManager (background sync), Retrofit + OkHttp (HTTP), Hilt (DI), Kotlin Coroutines + Flow (002-session-local-sync)
- Room (SQLite, encrypted via SQLCipher per constitution) — local source of truth; PostgreSQL on server via NestJS API (002-session-local-sync)
- TypeScript 5.x strict mode (API: NestJS 11+, Web: Next.js 16+ App Router) + Prisma (ORM), Recharts (charts), shadcn/ui + Radix UI + TailwindCSS v4 (web UI), class-validator + class-transformer (API DTOs), Vitest + Testing Library (web tests), Jest + Supertest (API tests) (003-session-analytics-view)
- PostgreSQL 15 (port 5440, Dockerized) — read-only queries; no schema migrations needed (003-session-analytics-view)
- TypeScript 5.x (web/api), Kotlin (mobile) + next-intl (web), nestjs-i18n (api), Android Resources + Kotlin (mobile) (004-i18n-setup)
- JSON files for translations (no database storage) (004-i18n-setup)

- TypeScript 5.0+ (strict mode), Kotlin (Android SDK 26+) + NestJS 11+ (Swagger/OpenAPI), Prisma, class-validator, class-transformer, openapi-generator-cli (001-api-contracts)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.0+ (strict mode), Kotlin (Android SDK 26+): Follow standard conventions

## Recent Changes
- 004-i18n-setup: Added TypeScript 5.x (web/api), Kotlin (mobile) + next-intl (web), nestjs-i18n (api), Android Resources + Kotlin (mobile)
- 003-session-analytics-view: Added TypeScript 5.x strict mode (API: NestJS 11+, Web: Next.js 16+ App Router) + Prisma (ORM), Recharts (charts), shadcn/ui + Radix UI + TailwindCSS v4 (web UI), class-validator + class-transformer (API DTOs), Vitest + Testing Library (web tests), Jest + Supertest (API tests)
- 002-session-local-sync: Added Kotlin (JVM 17, Min SDK 26, Target SDK 34) + Room (local DB), WorkManager (background sync), Retrofit + OkHttp (HTTP), Hilt (DI), Kotlin Coroutines + Flow


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
