# Feature Specification: API Contracts — Single Source of Truth

**Feature Branch**: `001-api-contracts`  
**Created**: 2026-02-15  
**Status**: Draft  
**Input**: User description: "Documentar la información del API para tener un solo origen de la verdad para que tanto API, web y mobile sepan como obtener información o actualizar. Estandarizar nombres y unificarlos para usar los mismos en ambas aplicaciones y evitar problemas al momento de sincronizar, todo esto por medio de contratos."

## Context & Problem Statement

Today the Symma platform has three consumers of the same data: the **web dashboard** (Next.js), the **REST API** (NestJS), and the **mobile app** (Android/Kotlin). Each consumer currently defines its own representation of entities and DTOs, leading to:

1. **Naming inconsistencies** — the same field is called different names across layers (e.g., `repsPerSet` in the database vs `targetRepetitions` in the mobile response; `targetHoldSeconds` vs `holdTimeSeconds`; `restBetweenSets` vs `restBetweenSetsSeconds`).
2. **Duplicated type definitions** — DTOs are declared independently in the API module layer and only partially mirrored in `shared-types`.
3. **Missing contracts** — several domains (auth responses, sessions, analytics, dashboard) have no shared type definitions at all, forcing each consumer to guess the response shape.
4. **Sync hazards** — when the mobile app sends session data back to the server, field-name mismatches can cause silent data loss or validation failures.

This feature establishes a **contract-first approach**: every request and response shape exchanged between API, web, and mobile is defined exactly once in the existing `@symma/shared-types` package (as mandated by Constitution Principle IV), and every consumer must conform to those contracts.

> **Note on mobile**: The Android app (Kotlin) cannot directly import TypeScript types. The NestJS API already uses Swagger decorators, so an **OpenAPI schema** will be generated at build time and `openapi-generator` will produce Kotlin data classes automatically. This ensures zero drift between the TypeScript contracts and the Kotlin models.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Unified Entity & DTO Contracts (Priority: P1)

As a **developer** working on any of the three apps (API, web, or mobile), I need a single, authoritative set of entity shapes, request DTOs, and response DTOs so that when I consume or produce data I am certain every field name, type, and optionality matches across the entire platform.

**Why this priority**: This is the foundation. Without a canonical set of contracts, every other story (sync, validation, documentation) inherits naming drift.

**Independent Test**: A developer can import any contract type from the shared package and the compiler (TypeScript or Kotlin code-gen) rejects payloads that do not match.

**Acceptance Scenarios**:

1. **Given** a developer imports `Patient` from the shared contracts, **When** they construct a payload with a misspelled or missing required field, **Then** the build fails at compile time.
2. **Given** the API returns a patient object, **When** the web app receives it, **Then** the response conforms exactly to the `PatientResponse` contract with zero manual mapping.
3. **Given** the mobile app constructs a `CreateSessionRequest`, **When** it sends the payload to the API, **Then** the API validates it against the same contract and accepts it without field-name mismatches.

---

### User Story 2 — Standardised Field Naming Convention (Priority: P1)

As a **tech lead**, I need a single naming convention applied consistently across all contracts so that developers never have to wonder whether a field is called `repsPerSet`, `targetRepetitions`, or `reps_per_set`.

**Why this priority**: Naming inconsistencies are the root cause of most sync bugs; fixing them is a prerequisite for reliable mobile ↔ API data exchange.

**Independent Test**: A linting rule or automated check can scan all contract definitions and confirm that every field follows the agreed naming convention.

**Acceptance Scenarios**:

1. **Given** the contracts package defines a routine item, **When** any consumer reads the `sets`, `repsPerSet`, and `targetHoldSeconds` fields, **Then** they use exactly those names — no aliases or renames.
2. **Given** a PR introduces a new field with a name that deviates from the convention, **When** CI runs, **Then** the build or lint step fails with a clear message about the naming violation.
3. **Given** the existing mobile response DTO renames `repsPerSet` → `targetRepetitions`, **When** this feature is implemented, **Then** the mobile DTO is updated to use the canonical name `repsPerSet` and the Android code is updated accordingly.

---

### User Story 3 — Complete Domain Coverage (Priority: P2)

As a **frontend/mobile developer**, I need contracts for every API domain — not just patients and routines — so that I never have to reverse-engineer a response shape from Swagger or network inspection.

**Why this priority**: Missing contracts for auth, sessions, analytics, and dashboard force consumers to maintain ad-hoc type definitions that drift over time.

**Independent Test**: Every controller endpoint in the API can be mapped to a corresponding request/response contract in the shared package; any unmapped endpoint is flagged.

**Acceptance Scenarios**:

1. **Given** the analytics endpoint returns routine history (`GET /routines/:id/history`), **When** the web app renders that data, **Then** it uses a `RoutineHistoryResponse` contract imported from the shared package.
2. **Given** the analytics endpoint returns routine stats, **When** the web dashboard renders charts, **Then** it uses an `AnalyticsStatsResponse` contract from the shared package.
3. **Given** the auth endpoint returns a login response with a token and user info, **When** both web and mobile consume it, **Then** they both use the same `LoginResponse` contract.

---

### User Story 4 — Mobile Sync Contract (Priority: P2)

As a **mobile developer**, I need an explicit sync contract that defines exactly what the mobile app sends when uploading offline-recorded sessions, including the `isSynced` flag semantics, so that no data is lost or misinterpreted during synchronisation.

**Why this priority**: The offline-first architecture means the mobile app accumulates local data that must match server expectations exactly when connectivity is restored.

**Independent Test**: A mock session payload built from the sync contract is accepted by the API without validation errors, and the resulting database record matches the payload 1:1.

**Acceptance Scenarios**:

1. **Given** the mobile app has recorded a session offline, **When** it serialises the session using the `CreateSessionRequest` contract, **Then** the API accepts the payload and persists all fields correctly.
2. **Given** a session item includes `averageAccuracy` and `seriesData`, **When** the mobile sends it, **Then** the API stores those fields under the exact same names without transformation.
3. **Given** the mobile app marks a session as synced locally, **When** the server confirms receipt, **Then** both sides agree on the sync field semantics: `isSynced` (boolean) and `syncedAt` (timestamp) are local-only fields per Constitution Principle II and MUST NOT be part of create-session requests sent to the server.

---

### User Story 5 — Contract Versioning Strategy (Priority: P3)

As a **platform maintainer**, I need a clear process for evolving contracts (adding fields, deprecating fields) so that changes do not break existing consumers that have not yet been updated.

**Why this priority**: Once contracts are established, the team needs a sustainable process for change without breaking backward compatibility.

**Independent Test**: A simulated contract change (adding an optional field) is applied, and all three consumers continue to build and pass tests without modification.

**Acceptance Scenarios**:

1. **Given** a new optional field is added to `PatientResponse`, **When** the web and mobile apps are rebuilt without code changes, **Then** they compile and function correctly (the field is simply `undefined`/`null`).
2. **Given** a required field is proposed for removal, **When** the change is reviewed, **Then** the process requires a deprecation period where the field is marked optional before being removed.

---

### Edge Cases

- What happens when the mobile app sends a payload with fields from an older contract version that the server no longer expects? The API must ignore unknown fields gracefully.
- What happens when a contract adds a new required field but the mobile app has not been updated? The server must return a clear validation error identifying the missing field.
- What happens when date/time fields are serialised differently (ISO 8601 with timezone vs without)? Contracts must specify the exact format.
- What happens when numeric precision differs (e.g., `difficultyLevel` as `Int` on mobile vs `Float` on server)? Contracts must specify the canonical type.
- What happens when `null` vs `undefined` vs absent field semantics differ between JSON producers? Contracts must define explicit optionality rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The platform MUST maintain a single shared contracts package that defines every entity shape, request DTO, and response DTO exchanged between API, web, and mobile.
- **FR-002**: Every field name in the contracts MUST follow camelCase as the **JSON wire format** (the format used in HTTP request/response bodies) consistently across all domains. Database column names (snake_case via Prisma `@map`) and Kotlin property names are outside the scope of this convention but MUST map to the canonical camelCase wire names.
- **FR-003**: The contracts package MUST cover all existing API domains: **Auth** (therapist login, patient/mobile login, profile), **Patients** (CRUD, access codes), **Routines** (CRUD, clone), **Exercises** (CRUD), **Sessions** (create), **Mobile** (active routine), **Analytics** (routine stats, history), and **Dashboard** (stats).
- **FR-004**: Each contract MUST explicitly declare field optionality — distinguishing between required, optional (may be absent), and nullable (present but may be `null`).
- **FR-005**: Date/time fields in contracts MUST use ISO 8601 format in UTC with the `Z` suffix (e.g., `2026-02-15T21:00:00.000Z`). Date-only fields (e.g., `dateOfBirth`) MUST use `YYYY-MM-DD` format. All consumers MUST serialize and parse dates in this exact format.
- **FR-006**: Numeric fields MUST specify whether they are integers or floating-point, and their valid range where applicable.
- **FR-007**: The contracts MUST resolve all existing naming inconsistencies, choosing one canonical name per concept. Specifically:
  - `repsPerSet` (not `targetRepetitions`)
  - `targetHoldSeconds` (not `holdTimeSeconds`)
  - `restBetweenSets` (not `restBetweenSetsSeconds`)
  - `score` as integer 0–100 (the canonical wire format is a percentage integer, matching current web usage; the API MUST convert the database float 0–1 to integer 0–100 before returning it)
- **FR-008**: The contracts MUST define a standard envelope for paginated responses (`data`, `total`, `page`, `limit`). All existing list endpoints (patients, routines, exercises) MUST be updated to accept `page` and `limit` query parameters and return responses conforming to the `PaginatedResponse<T>` envelope.
- **FR-009**: The contracts MUST define a standard error response shape (`statusCode`, `message`, `error`).
- **FR-010**: New fields added to contracts MUST be optional to maintain backward compatibility; removing or renaming a field MUST follow a documented deprecation process.
- **FR-011**: The API MUST validate incoming requests against the contract definitions at runtime — only declared fields are validated; fields not declared in the contract are silently stripped (whitelist approach).
- **FR-012**: The API MUST strip (not reject) unknown/extra fields in incoming requests, to tolerate older or newer clients. This complements FR-011: known fields are validated, unknown fields are discarded.
- **FR-013**: The mobile sync contract MUST define that `isSynced` and `syncedAt` are local-only fields (per Constitution Principle II) and MUST NOT be part of create-session requests sent to the server. The server response to a successful session creation serves as the sync acknowledgement.

### Key Entities

- **Contract**: A formal definition of the shape (fields, types, optionality) of data exchanged between two systems. Each contract maps to one or more API endpoints.
- **Entity Type**: The canonical representation of a domain object (Patient, Therapist, Routine, Exercise, Session, etc.) as returned by the API.
- **Request DTO**: The shape of data a consumer sends to the API for create/update operations.
- **Response DTO**: The shape of data the API returns, which may include computed or joined fields not present in the request.
- **Enum Contract**: A shared set of allowed string values for categorical fields (Gender, PatientStatus, Role, ExerciseType, ExerciseCategory, RoutineStatus, MobileModule).

### Domain Contract Map

The following domains require contracts:

| Domain | Endpoints | Request Contracts | Response Contracts |
|--------|-----------|-------------------|--------------------|
| **Auth (Therapist)** | `POST /auth/login`, `GET /auth/profile` | `LoginRequest` | `LoginResponse`, `TherapistProfileResponse` |
| **Auth (Mobile)** | `POST /auth/patient/login` | `MobileLoginRequest` | `MobileLoginResponse` |
| **Patients** | CRUD + access codes | `CreatePatientRequest`, `UpdatePatientRequest` | `PatientResponse`, `PatientListResponse`, `AccessCodeResponse` |
| **Routines** | CRUD + clone | `CreateRoutineRequest`, `UpdateRoutineRequest` | `RoutineResponse`, `RoutineListResponse` |
| **Exercises** | CRUD | `CreateExerciseRequest`, `UpdateExerciseRequest` | `ExerciseResponse` |
| **Sessions** | `POST /sessions` | `CreateSessionRequest` | `SessionResponse` |
| **Deletes** | `DELETE /patients/:id`, `DELETE /routines/:id`, `DELETE /exercises/:id`, `DELETE /patients/:id/access-code` | — | Standard `204 No Content` (no body) |
| **Mobile** | `GET /mobile/routine/active` | — | `ActiveRoutineResponse` |
| **Analytics** | `GET /routines/:id/stats`, `GET /routines/:id/history` | — | `RoutineStatsResponse`, `RoutineHistoryResponse` |
| **Dashboard** | `GET /dashboard/stats` | — | `DashboardStatsResponse` |

## Assumptions

- The existing `@symma/shared-types` package (`packages/shared-types`) is the target location for all contracts, as established by Constitution Principle IV. No new package will be created.
- The NestJS Swagger decorators already in place will be used to generate an OpenAPI specification at build time. The `openapi-generator` tool will then produce Kotlin data classes for the Android app, ensuring the mobile models are always in sync with the TypeScript contracts without manual mirroring.
- The canonical score format in contracts is **integer 0–100** (percentage). The API converts from the database float (0–1) to integer percentage before returning. All consumers display scores as-is without further conversion.
- The Prisma schema in `packages/database/prisma/schema.prisma` remains the canonical data model; contracts describe the **wire format** (what goes over HTTP), not the storage format.
- The API is the sole producer of response shapes; web and mobile are consumers. Mobile is additionally a producer of session-creation requests.
- Enum values are string unions (not numeric), matching the current Prisma enum definitions.
- The `therapistId` is derived from the JWT token on the server side and MUST NOT appear in request bodies for security reasons (already the current behavior).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of API endpoints have a corresponding request and/or response contract defined in the shared package.
- **SC-002**: Zero naming inconsistencies exist between the shared contracts, the API DTOs, and the web/mobile consumers — verified by automated tests.
- **SC-003**: The mobile app can build a session payload using shared contract types, send it to the API, and have it accepted without any field-name mapping or transformation layer.
- **SC-004**: Adding a new optional field to a response contract does not break compilation or tests in any of the three consumers.
- **SC-005**: A developer unfamiliar with the codebase can discover the exact shape of any API request or response by looking at a single file in the contracts package, without consulting Swagger, controller code, or network logs.
- **SC-006**: All enum values used across the platform are defined exactly once in the contracts package and referenced everywhere else.
