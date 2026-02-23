# symma-platform Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-15

## Active Technologies
- Kotlin (Android, Min SDK 26 / Target 34), TypeScript (contracts/docs) + Jetpack Compose, Hilt, MediaPipe FaceLandmarker, Kotlin Coroutines/Flow, Retrofit + Gson (001-fix-isometric-calibration)
- Room (local source of truth) + Prisma/PostgreSQL via existing API contracts (no schema migration required for MVP behavior) (001-fix-isometric-calibration)

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
- 001-fix-isometric-calibration: Added Kotlin (Android, Min SDK 26 / Target 34), TypeScript (contracts/docs) + Jetpack Compose, Hilt, MediaPipe FaceLandmarker, Kotlin Coroutines/Flow, Retrofit + Gson

- 001-api-contracts: Added TypeScript 5.0+ (strict mode), Kotlin (Android SDK 26+) + NestJS 11+ (Swagger/OpenAPI), Prisma, class-validator, class-transformer, openapi-generator-cli

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
