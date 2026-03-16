# Research: API Contracts — Single Source of Truth

**Branch**: `001-api-contracts` | **Date**: 2026-02-15

## R1: OpenAPI Schema Generation from NestJS

**Decision**: Use a dedicated build script that bootstraps the NestJS app, calls `SwaggerModule.createDocument()`, writes the result to `apps/api/openapi.json`, and exits.

**Rationale**: NestJS requires the app to be instantiated to resolve all decorators and generate the OpenAPI document. A standalone script (`apps/api/scripts/generate-openapi.ts`) that creates the app, generates the doc, writes it to disk, and calls `app.close()` is the standard approach. This can be integrated as a Turborepo task (`pnpm run generate:openapi`) and run before the mobile code-gen step.

**Alternatives considered**:
- **Runtime endpoint only** (`/api-json`): Requires a running server + database, unsuitable for CI/CD pipelines where DB may not be available.
- **NestJS CLI Plugin** (`@nestjs/swagger/plugin`): Only enhances decorator inference, does not generate standalone files.
- **Manual OpenAPI spec**: Would defeat the purpose of contract-first — the spec would drift from the actual controllers.

## R2: Kotlin Data Class Generation via openapi-generator

**Decision**: Use `@openapitools/openapi-generator-cli` with the `kotlin` generator targeting model-only output.

**Rationale**: The `openapi-generator` project is the most mature and widely used tool for generating typed clients from OpenAPI specs. Using the `kotlin` generator with `--global-property models` produces only data classes (no full client), which is what we need since the mobile app already uses Retrofit with manual endpoint definitions.

**Configuration**:
- Generator: `kotlin`
- Model package: `com.symma.app.data.remote.model`
- Global property: `models` (model classes only, no API client)
- Additional properties: `serializationLibrary=gson` (matches existing Retrofit/Gson setup), `dateLibrary=string` (ISO 8601 strings, not Java date objects)

**Alternatives considered**:
- **Manual Kotlin mirroring**: Rejected — prone to drift, requires discipline.
- **KotlinPoet custom script**: Higher control but significant maintenance overhead.
- **Swagger Codegen**: Predecessor to openapi-generator, less maintained.

## R3: Shared Types Package File Organisation

**Decision**: Split the monolithic `packages/shared-types/src/index.ts` into domain-specific files with a barrel re-export.

**Rationale**: The current single-file approach (191 lines) will not scale to ~30+ contract types across 9 domains. Domain-specific files (`auth.ts`, `patients.ts`, `routines.ts`, etc.) improve discoverability and reduce merge conflicts. A barrel `index.ts` re-exports everything for backward compatibility.

**File structure**:
- `enums.ts` — all shared enums (single source for enum values)
- `common.ts` — `PaginatedResponse<T>`, `ApiError`, `PaginationQuery`
- One file per domain: `auth.ts`, `patients.ts`, `routines.ts`, `exercises.ts`, `sessions.ts`, `mobile.ts`, `analytics.ts`, `dashboard.ts`
- `index.ts` — re-exports all

**Alternatives considered**:
- **Keep single file**: Rejected — 30+ types in one file is unwieldy.
- **One file per type**: Too granular — ~30 files for a types-only package is excessive.

## R4: API DTO Alignment Strategy

**Decision**: API DTOs (class-validator classes) will implement the shared-types interfaces. Shared-types defines the shape (interface), API DTOs add runtime validation decorators (class).

**Rationale**: TypeScript interfaces are erased at runtime and cannot carry class-validator decorators. The pattern is: `shared-types` exports `interface CreatePatientRequest { ... }` and the API DTO declares `class CreatePatientDto implements CreatePatientRequest { ... }` with decorators. If a DTO field name doesn't match the interface, TypeScript compilation fails — this is the compile-time enforcement.

**Alternatives considered**:
- **DTOs ARE the shared types**: Would require shared-types to depend on class-validator/class-transformer, polluting a pure types package.
- **Separate validation schemas (Zod/Yup)**: Would require migrating away from class-validator, which is the NestJS standard.

## R5: Whitelist Validation (FR-011 / FR-012)

**Decision**: Enable `whitelist: true` and `forbidNonWhitelisted: false` on the global `ValidationPipe`.

**Rationale**: With `whitelist: true`, class-transformer strips any properties not decorated with class-validator decorators. With `forbidNonWhitelisted: false` (default), unknown properties are silently removed rather than causing a 400 error. This fulfills both FR-011 (validate known fields) and FR-012 (strip unknown fields).

**Implementation**: In `apps/api/src/main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
}));
```

**Alternatives considered**:
- **forbidNonWhitelisted: true**: Would reject requests with extra fields, breaking older clients.
- **No whitelist**: Would allow arbitrary data to pass through to services.

## R6: Pagination Implementation

**Decision**: Offset-based pagination with `page` (1-indexed, default 1) and `limit` (default 20, max 100) query parameters. Responses use `PaginatedResponse<T>` envelope.

**Rationale**: Offset-based pagination is the simplest model for the current use case (therapist viewing patient lists). Cursor-based pagination is more efficient at scale but adds unnecessary complexity for lists that are unlikely to exceed hundreds of items per therapist.

**Contract**:
```typescript
interface PaginationQuery {
  page?: number;  // 1-indexed, default 1
  limit?: number; // default 20, max 100
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

**Endpoints affected**: `GET /patients`, `GET /routines`, `GET /exercises`

**Alternatives considered**:
- **Cursor-based**: Overkill for lists scoped to a single therapist (typically <100 items).
- **No pagination**: Risk of performance degradation as data grows.

## R7: Naming Inconsistency Resolution

**Decision**: Canonical names follow the Prisma schema field names (camelCase), which already match the `shared-types` interfaces.

**Mapping of current inconsistencies**:

| Prisma Schema (canonical) | Current Mobile DTO | Action |
|--------------------------|-------------------|--------|
| `sets` | `targetSets` | Mobile DTO → `sets` |
| `repsPerSet` | `targetRepetitions` | Mobile DTO → `repsPerSet` |
| `targetHoldSeconds` | `holdTimeSeconds` | Mobile DTO → `targetHoldSeconds` |
| `restBetweenSets` | `restBetweenSetsSeconds` | Mobile DTO → `restBetweenSets` |
| `difficultyLevel` (Float) | `difficultyLevel` (Float) | ✅ Already consistent |
| `strictMode` | `strictMode` | ✅ Already consistent |

**Files requiring changes**:
- `apps/api/src/mobile/dto/active-routine-response.dto.ts` — rename 4 fields
- `apps/api/src/mobile/mobile.service.ts` — update field mapping (lines 37-40)
- `apps/mobile/` — auto-generated from OpenAPI, no manual changes needed

## R8: Score Format Standardisation

**Decision**: Canonical wire format is **integer 0–100** (percentage).

**Rationale**: The web dashboard already consumes scores as percentages. Changing to float 0–1 would be a breaking change with no user-facing benefit. The API will handle the conversion from the database float (0–1) to the wire integer (0–100) in the service layer.

**Implementation**: The analytics controller already does `Math.round(avgScore * 100)`. This pattern will be documented as the standard conversion in the contracts.
