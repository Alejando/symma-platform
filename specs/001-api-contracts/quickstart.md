# Quickstart: API Contracts — Single Source of Truth

**Branch**: `001-api-contracts` | **Date**: 2026-02-15

This guide explains how to work with the Symma API contracts after implementation.

---

## 1. Where Contracts Live

All contract types are in `packages/shared-types/src/`:

```
packages/shared-types/src/
├── index.ts          # Barrel re-export (import anything from here)
├── enums.ts          # Gender, Role, ExerciseType, etc.
├── common.ts         # PaginatedResponse<T>, ApiError, PaginationQuery
├── auth.ts           # Login, profile contracts
├── patients.ts       # Patient CRUD contracts
├── routines.ts       # Routine CRUD contracts
├── exercises.ts      # Exercise CRUD contracts
├── sessions.ts       # Session creation contract (mobile sync)
├── mobile.ts         # Active routine response
├── analytics.ts      # Routine stats/history
└── dashboard.ts      # Dashboard stats
```

## 2. Importing Contracts

### In apps/web (Next.js)

```typescript
import type { PatientResponse, PaginatedResponse } from '@symma/shared-types';

const response = await fetch('/api/patients?page=1&limit=20');
const data: PaginatedResponse<PatientResponse> = await response.json();
```

### In apps/api (NestJS)

API DTOs implement the shared interfaces and add class-validator decorators:

```typescript
import type { CreatePatientRequest } from '@symma/shared-types';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreatePatientDto implements CreatePatientRequest {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  // ... all fields from the interface, with decorators
}
```

If a DTO field name doesn't match the interface, **TypeScript compilation fails**.

### In apps/mobile (Kotlin)

Kotlin data classes are auto-generated from the OpenAPI spec:

```bash
# Generate Kotlin models from OpenAPI spec
pnpm run generate:openapi    # Step 1: Generate openapi.json from NestJS
pnpm run generate:kotlin     # Step 2: Generate Kotlin data classes
```

Generated files land in `apps/mobile/app/src/main/java/com/symma/app/data/remote/model/`.

## 3. Adding a New Contract

1. **Define the interface** in the appropriate domain file in `packages/shared-types/src/`
2. **Re-export** from `index.ts` if not already covered by a wildcard
3. **Add Swagger decorators** to the corresponding NestJS DTO (or create a new one that `implements` the interface)
4. **Run** `pnpm run generate:openapi` to update the OpenAPI spec
5. **Run** `pnpm run generate:kotlin` to regenerate Kotlin models
6. **Import** the type in `apps/web` consumers

## 4. Naming Rules

| Rule | Example |
|------|---------|
| JSON wire format: **camelCase** | `repsPerSet`, `targetHoldSeconds` |
| Dates (datetime): **ISO 8601 UTC** | `2026-02-15T21:00:00.000Z` |
| Dates (date-only): **YYYY-MM-DD** | `2026-02-15` |
| IDs: **UUID strings** | `550e8400-e29b-41d4-a716-446655440000` |
| Scores: **integer 0–100** | `85` (API converts from DB float 0–1) |
| Enums: **UPPER_SNAKE_CASE strings** | `ISOTONIC`, `ACTIVE`, `MALE` |

### Canonical Field Names (resolved inconsistencies)

| Canonical Name | Former Aliases (do NOT use) |
|---------------|---------------------------|
| `sets` | `targetSets` |
| `repsPerSet` | `targetRepetitions` |
| `targetHoldSeconds` | `holdTimeSeconds` |
| `restBetweenSets` | `restBetweenSetsSeconds` |
| `accessToken` | `access_token` |

## 5. Pagination

All list endpoints accept `page` and `limit` query parameters:

```
GET /patients?page=1&limit=20&search=John
GET /routines?page=2&limit=10
GET /exercises?page=1&limit=50
```

Response envelope:

```json
{
  "data": [...],
  "total": 47,
  "page": 1,
  "limit": 20
}
```

## 6. Error Responses

All errors follow the `ApiError` contract:

```json
{
  "statusCode": 400,
  "message": ["firstName must be a string"],
  "error": "Bad Request"
}
```

## 7. Mobile Sync Notes

- `isSynced` and `syncedAt` are **local-only** Room fields — never sent to the API
- The mobile app sends `CreateSessionRequest` when syncing offline sessions
- The server response (`SessionResponse`) serves as the sync acknowledgement
- Unknown fields in requests are silently stripped (not rejected)

## 8. Evolving Contracts

- **Adding a field**: Must be optional. No consumer changes required.
- **Removing a field**: Mark optional first (deprecation period), then remove in next version.
- **Renaming a field**: Treat as add-new + deprecate-old. Never rename in-place.

## 9. Useful Commands

```bash
# Development
pnpm dev                     # Start all dev servers
pnpm build                   # Build all packages (validates types)
pnpm check-types             # Type-check without building

# OpenAPI / Code Generation
pnpm run generate:openapi    # Generate openapi.json from NestJS decorators
pnpm run generate:kotlin     # Generate Kotlin data classes from openapi.json

# Testing
pnpm test                    # Run all tests
pnpm test --filter=api       # Run API tests only
pnpm test --filter=web       # Run web tests only
```
