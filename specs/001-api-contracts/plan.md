# Implementation Plan: API Contracts — Single Source of Truth

**Branch**: `001-api-contracts` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-api-contracts/spec.md`

## Summary

Establish a contract-first approach by consolidating all API request/response type definitions into the existing `@symma/shared-types` package. This includes: (1) defining canonical TypeScript interfaces for all 9 API domains with standardised camelCase field names, (2) resolving existing naming inconsistencies between API, web, and mobile layers, (3) adding pagination support to all list endpoints, (4) setting up OpenAPI schema generation + `openapi-generator` for automatic Kotlin data class production, and (5) aligning API DTOs to import from shared contracts instead of duplicating definitions.

## Technical Context

**Language/Version**: TypeScript 5.0+ (strict mode), Kotlin (Android SDK 26+)  
**Primary Dependencies**: NestJS 11+ (Swagger/OpenAPI), Prisma, class-validator, class-transformer, openapi-generator-cli  
**Storage**: PostgreSQL 15 (Dockerized, port 5440) via Prisma ORM  
**Testing**: Jest + Supertest (API), Vitest + Testing Library (Web), JUnit + MockK (Mobile)  
**Target Platform**: Monorepo — API (Node.js server), Web (Next.js 16+), Mobile (Android)  
**Project Type**: Monorepo (apps/api + apps/web + apps/mobile + packages/shared-types)  
**Performance Goals**: N/A (this feature is a type-system and contract change, no runtime performance impact)  
**Constraints**: Backward-compatible — existing web consumers must not break; mobile uses OpenAPI code-gen  
**Scale/Scope**: 9 API domains, ~30 contract types (entities + request DTOs + response DTOs + enums), 3 consumers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Impact on This Feature |
|-----------|--------|----------------------|
| **I. Patient Privacy First** | ✅ PASS | No new data exposure. Contracts define wire shapes, not new data collection. `therapistId` remains server-derived from JWT. |
| **II. Offline-First Mobile** | ✅ PASS | FR-013 explicitly defines `isSynced` and `syncedAt` as local-only fields. Sync contract aligns with WorkManager batching pattern. |
| **III. On-Device Computer Vision** | ✅ N/A | No CV changes. Session result contracts (`averageAccuracy`, `seriesData`) carry CV metadata but processing remains on-device. |
| **IV. Type Safety Across Boundaries** | ✅ PASS — **Primary driver** | This feature directly fulfills Principle IV: all contracts in `packages/shared-types`, strict TS, class-validator DTOs. Kotlin mirroring via OpenAPI code-gen. |
| **V. Test-Driven Quality** | ✅ PASS | Every new/modified module requires co-located tests. Contract conformance tests will verify API responses match shared types. |
| **VI. Clinical Accuracy** | ✅ PASS | Score contract standardised as integer 0–100. `initialParalysisDegree` (House-Brackmann 1–6) preserved in patient contract with Int range validation. |
| **VII. Monorepo Cohesion** | ✅ PASS | Uses pnpm, extends existing `packages/shared-types`, Turborepo orchestration. OpenAPI gen added as a Turborepo task. Makefile updated. |

**Gate result**: ✅ ALL PASS — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-api-contracts/
├── plan.md              # This file
├── research.md          # Phase 0: research findings
├── data-model.md        # Phase 1: entity/contract model
├── quickstart.md        # Phase 1: developer quickstart guide
├── contracts/           # Phase 1: OpenAPI contract schemas
│   ├── auth.yaml
│   ├── patients.yaml
│   ├── routines.yaml
│   ├── exercises.yaml
│   ├── sessions.yaml
│   ├── mobile.yaml
│   ├── analytics.yaml
│   ├── dashboard.yaml
│   └── common.yaml      # Shared enums, pagination, errors
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/shared-types/
├── src/
│   ├── index.ts                # Re-exports all contracts
│   ├── enums.ts                # All shared enums (Gender, Role, ExerciseType, etc.)
│   ├── common.ts               # PaginatedResponse<T>, ApiError, PaginationQuery
│   ├── auth.ts                 # LoginRequest/Response, MobileLoginRequest/Response, TherapistProfileResponse
│   ├── patients.ts             # CreatePatientRequest, UpdatePatientRequest, PatientResponse, AccessCodeResponse
│   ├── routines.ts             # CreateRoutineRequest, UpdateRoutineRequest, RoutineResponse, RoutineItemResponse
│   ├── exercises.ts            # CreateExerciseRequest, UpdateExerciseRequest, ExerciseResponse
│   ├── sessions.ts             # CreateSessionRequest, SessionItemRequest, SessionResponse
│   ├── mobile.ts               # ActiveRoutineResponse, ActiveRoutineItemResponse
│   ├── analytics.ts            # RoutineStatsResponse, RoutineHistoryResponse
│   └── dashboard.ts            # DashboardStatsResponse, AtRiskPatientResponse
└── package.json

apps/api/src/
├── auth/
│   ├── dto/login.dto.ts               # Imports from @symma/shared-types, adds class-validator decorators
│   ├── types.ts                       # Updated: LoginResponse, TherapistInfo → imports from shared-types
│   └── mobile-auth.controller.ts      # MobileLoginDto → imports from shared-types
├── patients/
│   ├── dto/create-patient.dto.ts      # Imports from @symma/shared-types (removes local Gender enum)
│   └── dto/update-patient.dto.ts
├── routines/
│   ├── dto/create-routine.dto.ts      # Already uses correct names (repsPerSet, targetHoldSeconds)
│   └── dto/update-routine.dto.ts
├── exercises/
│   ├── dto/create-exercise.dto.ts     # Imports enums from @symma/shared-types (removes @prisma/client import)
│   └── dto/update-exercise.dto.ts
├── sessions/
│   └── dto/create-session.dto.ts      # Aligns field names with shared contract
├── mobile/
│   ├── dto/active-routine-response.dto.ts  # Fixes naming: targetRepetitions→repsPerSet, etc.
│   └── mobile.service.ts                    # Updates field mapping to use canonical names
├── analytics/
│   └── analytics.controller.ts        # Score conversion: ensures integer 0–100 output
└── main.ts                            # OpenAPI spec generation setup

apps/web/src/
└── [consumers updated to import types from @symma/shared-types instead of local definitions]

apps/mobile/
└── [Kotlin data classes auto-generated from OpenAPI spec via openapi-generator]
```

**Structure Decision**: This feature modifies the existing monorepo structure across `packages/shared-types` (primary), `apps/api` (DTO alignment), `apps/web` (consumer imports), and `apps/mobile` (OpenAPI code-gen output). No new packages or apps are created.

## Complexity Tracking

> No constitution violations found. Table intentionally left empty.
