# Tasks: API Contracts — Single Source of Truth

**Input**: Design documents from `/specs/001-api-contracts/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included — Constitution Principle V (Test-Driven Quality) is NON-NEGOTIABLE.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restructure `@symma/shared-types` package and set up OpenAPI code generation tooling.

- [x] T001 Create domain file skeletons in `packages/shared-types/src/` — create empty files: `enums.ts`, `common.ts`, `auth.ts`, `patients.ts`, `routines.ts`, `exercises.ts`, `sessions.ts`, `mobile.ts`, `analytics.ts`, `dashboard.ts`
- [x] T002 [P] Install `@openapitools/openapi-generator-cli` as devDependency in root `package.json` — run `pnpm add -wD @openapitools/openapi-generator-cli`
- [x] T003 [P] Create OpenAPI generation script at `apps/api/scripts/generate-openapi.ts` — bootstraps NestJS app, calls `SwaggerModule.createDocument()`, writes JSON to `apps/api/openapi.json`, exits (per research R1)
- [x] T004 [P] Add `generate:openapi` script to `apps/api/package.json` and `generate:kotlin` script to root `package.json` with openapi-generator config (generator: `kotlin`, model package: `com.symma.app.data.remote.model`, global property: `models`, serializationLibrary: `gson`, dateLibrary: `string`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Populate `packages/shared-types/src/enums.ts` with all unified enums: `Gender`, `PatientStatus`, `Role`, `ExerciseType`, `ExerciseCategory`, `RoutineStatus`, `MobileModule` as string union types (per data-model.md Enums section). Remove `MOBILE_SUPPORTED_TYPES` constant (it's API implementation detail, not a contract).
- [x] T006 [P] Populate `packages/shared-types/src/common.ts` with `PaginationQuery`, `PaginatedResponse<T>`, and `ApiError` interfaces (per data-model.md Common section)
- [x] T007 Update `apps/api/src/main.ts` — change `forbidNonWhitelisted: true` to `forbidNonWhitelisted: false` in the global `ValidationPipe` config (per research R5: strip unknown fields instead of rejecting)
- [x] T008 Update `packages/shared-types/src/index.ts` — replace entire contents with barrel re-exports from all domain files (`export * from './enums'`, `export * from './common'`, `export * from './auth'`, etc.). Preserve backward compatibility by ensuring all previously exported types are still available.
- [x] T009 [P] Write unit test `packages/shared-types/src/index.spec.ts` — verify all exported types are accessible from the barrel and that the module compiles with strict TypeScript

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Unified Entity & DTO Contracts (Priority: P1) 🎯 MVP

**Goal**: Define canonical TypeScript interfaces for Patients, Routines, and Exercises domains in `@symma/shared-types` and align all API DTOs to implement those interfaces. Implement pagination on all list endpoints.

**Independent Test**: Import any contract type from the shared package → compiler rejects payloads that do not match.

### Tests for User Story 1

- [x] T010 [P] [US1] Contract conformance test for patients in `apps/api/src/patients/patients.controller.spec.ts` — verify `GET /patients` returns `PaginatedResponse<PatientResponse>`, `POST /patients` accepts `CreatePatientRequest` shape, `PATCH /patients/:id` accepts `UpdatePatientRequest` shape
- [x] T011 [P] [US1] Contract conformance test for routines in `apps/api/src/routines/routines.controller.spec.ts` — verify `GET /routines` returns `PaginatedResponse<RoutineResponse>`, `POST /routines` accepts `CreateRoutineRequest` shape
- [x] T012 [P] [US1] Contract conformance test for exercises in `apps/api/src/exercises/exercises.controller.spec.ts` — verify `GET /exercises` returns `PaginatedResponse<ExerciseResponse>`, `POST /exercises` accepts `CreateExerciseRequest` shape

### Implementation for User Story 1

- [x] T013 [P] [US1] Populate `packages/shared-types/src/patients.ts` — define `CreatePatientRequest`, `UpdatePatientRequest`, `PatientResponse`, `AccessCodeResponse`, `AccessCodeStatusResponse` interfaces (per data-model.md Patients section). Import `Gender`, `PatientStatus` from `./enums`.
- [x] T014 [P] [US1] Populate `packages/shared-types/src/routines.ts` — define `RoutineItemRequest`, `CreateRoutineRequest`, `UpdateRoutineRequest`, `RoutineItemResponse`, `RoutineResponse` interfaces (per data-model.md Routines section). Import `RoutineStatus`, `ExerciseResponse` from sibling files.
- [x] T015 [P] [US1] Populate `packages/shared-types/src/exercises.ts` — define `ExerciseDefaultConfig`, `CreateExerciseRequest`, `UpdateExerciseRequest`, `ExerciseResponse` interfaces (per data-model.md Exercises section). Import `ExerciseType`, `ExerciseCategory`, `MobileModule` from `./enums`.
- [x] T016 [US1] Update `apps/api/src/patients/dto/create-patient.dto.ts` — add `implements CreatePatientRequest` to class declaration, import `CreatePatientRequest` from `@symma/shared-types`, remove local `Gender` enum (import from `@symma/shared-types` instead)
- [x] T017 [US1] Update `apps/api/src/patients/dto/update-patient.dto.ts` — remove local `PatientStatus` enum (import from `@symma/shared-types` instead), verify class fields align with `UpdatePatientRequest` interface
- [x] T018 [US1] Update `apps/api/src/routines/dto/create-routine.dto.ts` — add `implements CreateRoutineRequest` to `CreateRoutineDto`, add `implements RoutineItemRequest` to `CreateRoutineItemDto`, import interfaces from `@symma/shared-types`
- [x] T019 [US1] Update `apps/api/src/routines/dto/update-routine.dto.ts` — verify `UpdateRoutineItemDto` fields align with `RoutineItemRequest` interface, import types from `@symma/shared-types`
- [x] T020 [US1] Update `apps/api/src/exercises/dto/create-exercise.dto.ts` — add `implements CreateExerciseRequest`, replace `@prisma/client` enum imports with `@symma/shared-types` imports (`ExerciseType`, `ExerciseCategory`, `MobileModule`)
- [x] T021 [US1] Update `apps/api/src/exercises/dto/update-exercise.dto.ts` — verify alignment with `UpdateExerciseRequest` interface
- [x] T022 [US1] Implement pagination on `apps/api/src/patients/patients.service.ts` and `apps/api/src/patients/patients.controller.ts` — accept `page` and `limit` query params, return `PaginatedResponse<PatientResponse>` with Prisma `skip`/`take` and `count`
- [x] T023 [US1] Implement pagination on `apps/api/src/routines/routines.service.ts` and `apps/api/src/routines/routines.controller.ts` — accept `page` and `limit` query params, return `PaginatedResponse<RoutineResponse>`
- [x] T024 [US1] Implement pagination on `apps/api/src/exercises/exercises.service.ts` and `apps/api/src/exercises/exercises.controller.ts` — accept `page` and `limit` query params, return `PaginatedResponse<ExerciseResponse>`

**Checkpoint**: Patients, Routines, and Exercises contracts are fully defined, API DTOs implement them, and all list endpoints return paginated responses. `pnpm build` passes.

---

## Phase 4: User Story 2 — Standardised Field Naming Convention (Priority: P1)

**Goal**: Resolve all existing naming inconsistencies across API DTOs and mobile response DTOs. Every field uses its canonical camelCase name as defined in the contracts.

**Independent Test**: All contract definitions use camelCase; mobile DTO fields match canonical names exactly.

### Tests for User Story 2

- [x] T025 [P] [US2] Write test in `apps/api/src/mobile/mobile.service.spec.ts` — verify `getActiveRoutine()` returns object with canonical field names: `sets` (not `targetSets`), `repsPerSet` (not `targetRepetitions`), `targetHoldSeconds` (not `holdTimeSeconds`), `restBetweenSets` (not `restBetweenSetsSeconds`)
- [x] T026 [P] [US2] Write test in `apps/api/src/auth/auth.service.spec.ts` — verify login response returns `accessToken` (camelCase), not `access_token` (snake_case)

### Implementation for User Story 2

- [x] T027 [US2] Fix `apps/api/src/mobile/dto/active-routine-response.dto.ts` — rename fields: `targetSets` → `sets`, `targetRepetitions` → `repsPerSet`, `holdTimeSeconds` → `targetHoldSeconds`, `restBetweenSetsSeconds` → `restBetweenSets`. Update `@ApiProperty` descriptions accordingly.
- [x] T028 [US2] Fix `apps/api/src/mobile/mobile.service.ts` — update field mapping at lines 37–40: `targetSets: item.sets` → `sets: item.sets`, `targetRepetitions: item.repsPerSet` → `repsPerSet: item.repsPerSet`, `holdTimeSeconds: item.targetHoldSeconds` → `targetHoldSeconds: item.targetHoldSeconds`, `restBetweenSetsSeconds: item.restBetweenSets` → `restBetweenSets: item.restBetweenSets`
- [x] T029 [US2] Fix `apps/api/src/auth/types.ts` — rename `access_token` to `accessToken` in `LoginResponse` interface. Update any service code that constructs this response (likely `apps/api/src/auth/auth.service.ts`).
- [x] T030 [US2] Remove duplicate enum declarations — ensure `Gender` enum in `apps/api/src/patients/dto/create-patient.dto.ts` and `PatientStatus` enum in `apps/api/src/patients/dto/update-patient.dto.ts` are replaced by imports from `@symma/shared-types`
- [x] T031 [US2] Remove `@prisma/client` enum imports from `apps/api/src/exercises/dto/create-exercise.dto.ts` — replace with imports from `@symma/shared-types` (already started in T020, verify complete)

**Checkpoint**: Zero naming inconsistencies between shared contracts and API DTOs. Mobile DTO uses canonical names. `pnpm build` passes.

---

## Phase 5: User Story 3 — Complete Domain Coverage (Priority: P2)

**Goal**: Add contract definitions for all remaining API domains: Auth, Sessions, Mobile, Analytics, and Dashboard.

**Independent Test**: Every controller endpoint in the API maps to a corresponding request/response contract in the shared package.

### Tests for User Story 3

- [x] T032 [P] [US3] Contract conformance test in `apps/api/src/auth/auth.controller.spec.ts` — verify `POST /auth/login` response matches `LoginResponse`, `GET /auth/profile` matches `TherapistProfileResponse`
- [x] T033 [P] [US3] Contract conformance test in `apps/api/src/sessions/sessions.controller.spec.ts` — verify `POST /sessions` accepts `CreateSessionRequest` shape and returns `SessionResponse`
- [x] T034 [P] [US3] Contract conformance test in `apps/api/src/analytics/analytics.controller.spec.ts` — verify `GET /routines/:id/stats` returns `RoutineStatsResponse`, `GET /routines/:id/history` returns `SessionResponse[]`
- [x] T035 [P] [US3] Contract conformance test in `apps/api/src/dashboard/dashboard.controller.spec.ts` — verify `GET /dashboard/stats` returns `DashboardStatsResponse`

### Implementation for User Story 3

- [x] T036 [P] [US3] Populate `packages/shared-types/src/auth.ts` — define `LoginRequest`, `LoginResponse`, `TherapistProfileResponse`, `MobileLoginRequest`, `MobileLoginResponse` interfaces (per data-model.md Auth section)
- [x] T037 [P] [US3] Populate `packages/shared-types/src/sessions.ts` — define `SessionItemRequest`, `CreateSessionRequest`, `SessionResponse`, `SessionItemResponse` interfaces (per data-model.md Sessions section)
- [x] T038 [P] [US3] Populate `packages/shared-types/src/mobile.ts` — define `ActiveRoutineResponse`, `ActiveRoutineItemResponse`, `ActiveRoutineExerciseResponse` interfaces (per data-model.md Mobile section)
- [x] T039 [P] [US3] Populate `packages/shared-types/src/analytics.ts` — define `RoutineStatsResponse`, `RoutineChartPoint` interfaces (per data-model.md Analytics section). `RoutineHistoryResponse` is `SessionResponse[]`.
- [x] T040 [P] [US3] Populate `packages/shared-types/src/dashboard.ts` — define `DashboardStatsResponse`, `DashboardMetric`, `AtRiskPatientResponse` interfaces (per data-model.md Dashboard section)
- [x] T041 [US3] Update `apps/api/src/auth/dto/login.dto.ts` — add `implements LoginRequest` to `LoginDto`, import from `@symma/shared-types`
- [x] T042 [US3] Create `apps/api/src/auth/dto/mobile-login.dto.ts` — create `MobileLoginDto implements MobileLoginRequest` with class-validator decorators, replace inline DTO in `mobile-auth.controller.ts`
- [x] T043 [US3] Update `apps/api/src/sessions/dto/create-session.dto.ts` — add `implements CreateSessionRequest` to `CreateSessionDto`, add `implements SessionItemRequest` to `SessionItemDto`, import from `@symma/shared-types`
- [x] T044 [US3] Update `apps/api/src/mobile/dto/active-routine-response.dto.ts` — add type annotations using `ActiveRoutineResponse`, `ActiveRoutineItemResponse`, `ActiveRoutineExerciseResponse` from `@symma/shared-types` (use enum types instead of plain `string` for `type`, `category`, `status`, `mobileModule`)
- [x] T045 [US3] Ensure score conversion in `apps/api/src/analytics/analytics.service.ts` — verify all score values returned are `Math.round(dbFloat * 100)` for integer 0–100 format (per research R8)
- [x] T046 [US3] Update `packages/shared-types/src/index.ts` — verify all new domain files are re-exported

**Checkpoint**: 100% of API endpoints have corresponding contract definitions. All 9 domains covered. `pnpm build` passes.

---

## Phase 6: User Story 4 — Mobile Sync Contract (Priority: P2)

**Goal**: Establish the end-to-end pipeline from TypeScript contracts → OpenAPI spec → Kotlin data classes. Ensure the session sync contract explicitly excludes local-only mobile fields.

**Independent Test**: A mock session payload built from the sync contract is accepted by the API without validation errors.

### Tests for User Story 4

- [x] T047 [P] [US4] Write test in `apps/api/src/sessions/sessions.controller.spec.ts` — verify that a `CreateSessionRequest` payload with `isSynced` or `syncedAt` fields has those fields stripped (not rejected) by the whitelist ValidationPipe
- [x] T048 [P] [US4] E2E test in `apps/api/test/sessions.e2e-spec.ts` — send a valid `CreateSessionRequest` payload (matching the contract from `@symma/shared-types`), verify 201 response with `SessionResponse` shape, verify all fields persisted correctly

### Implementation for User Story 4

- [x] T049 [US4] Add comprehensive `@ApiProperty()` Swagger decorators to all session DTOs in `apps/api/src/sessions/dto/create-session.dto.ts` — ensure each field has correct type, description, and required/optional markers for accurate OpenAPI generation
- [x] T050 [US4] Add comprehensive `@ApiProperty()` Swagger decorators to `apps/api/src/mobile/dto/active-routine-response.dto.ts` — ensure all fields have correct type annotations including enum references
- [x] T051 [US4] Create `openapitools.json` config file at repository root — configure Kotlin generator with model package `com.symma.app.data.remote.model`, `serializationLibrary=gson`, `dateLibrary=string`, output directory `apps/mobile/app/src/main/java`
- [x] T052 [US4] Add Turborepo pipeline task for `generate:openapi` in `turbo.json` — depends on `api#build`, outputs `apps/api/openapi.json`
- [x] T053 [US4] Update `Makefile` — add `generate-openapi` and `generate-kotlin` targets

**Checkpoint**: Running `pnpm run generate:openapi && pnpm run generate:kotlin` produces Kotlin data classes matching all TypeScript contracts. Session sync payload accepted by API.

---

## Phase 7: User Story 5 — Contract Versioning Strategy (Priority: P3)

**Goal**: Document a clear, sustainable process for evolving contracts without breaking existing consumers.

**Independent Test**: Adding an optional field to a response contract does not break compilation or tests in any consumer.

### Tests for User Story 5

- [x] T054 [US5] Write regression test in `packages/shared-types/src/versioning.spec.ts` — verify that adding an optional field to `PatientResponse` still compiles when consumed without changes by a mock web consumer and a mock API producer

### Implementation for User Story 5

- [x] T055 [US5] Create `packages/shared-types/CONTRIBUTING.md` — document contract evolution rules: (1) new fields must be optional, (2) removing fields requires deprecation period (mark optional + `@deprecated` JSDoc), (3) renaming = add-new + deprecate-old, (4) enum value additions are non-breaking, (5) enum value removals require deprecation
- [x] T056 [US5] Add `@deprecated` JSDoc pattern example to `packages/shared-types/src/patients.ts` — add a commented-out example showing how to deprecate a field for reference
- [x] T057 [US5] Add versioning note to `packages/shared-types/package.json` — document that the package follows SemVer: PATCH for optional field additions, MINOR for new contracts, MAJOR for required field changes or removals

**Checkpoint**: Team has documented process for contract changes. Regression test proves optional field additions are non-breaking.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Update all consumers, validate full build, and ensure end-to-end consistency.

- [x] T058 [P] Update web consumer imports across `apps/web/src/` (15 files) — replace any locally-defined types with imports from `@symma/shared-types`. Key files: `lib/api.ts`, `components/patients/patient-table.tsx`, `components/patients/patient-dialog.tsx`, `components/routines/routine-builder.tsx`, `app/dashboard/exercises/page.tsx`
- [x] T059 [P] Update web pagination consumers — update `apps/web/src/app/dashboard/patients/page.tsx` and other list pages to pass `page`/`limit` query params and handle `PaginatedResponse<T>` envelope
- [x] T060 Run `pnpm build` across entire monorepo — verify zero compilation errors in `packages/shared-types`, `apps/api`, and `apps/web`
- [x] T061 Run `pnpm test` across entire monorepo — verify all existing and new tests pass
- [x] T062 Run `pnpm lint` — verify no linting violations introduced
- [x] T063 Validate `specs/001-api-contracts/quickstart.md` instructions — manually verify that the documented import patterns, commands, and naming rules match the implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 file skeletons exist) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (enums, common, barrel export ready)
- **US2 (Phase 4)**: Depends on Phase 2 (enums available for import). Can run in parallel with US1.
- **US3 (Phase 5)**: Depends on Phase 2. Can run in parallel with US1/US2.
- **US4 (Phase 6)**: Depends on US3 (session contracts must exist) and Phase 1 (OpenAPI tooling)
- **US5 (Phase 7)**: Depends on US1 (contracts must exist for versioning test). Minimal other deps.
- **Polish (Phase 8)**: Depends on US1, US2, US3 completion

### User Story Dependencies

```
Phase 1: Setup
     │
Phase 2: Foundational
     │
     ├──────────────┬──────────────┐
     ▼              ▼              ▼
Phase 3: US1    Phase 4: US2   Phase 5: US3
  (P1)            (P1)           (P2)
     │                             │
     │                             ▼
     │                        Phase 6: US4
     │                           (P2)
     ▼
Phase 7: US5
  (P3)
     │
     ▼
Phase 8: Polish
```

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Shared-types interfaces before API DTOs
3. API DTOs before service/controller changes
4. Core implementation before integration
5. Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can all run in parallel (after T001)
- **Phase 2**: T006 can run in parallel with T005
- **Phase 3**: T010, T011, T012 (tests) in parallel; T013, T014, T015 (contracts) in parallel; T022, T023, T024 (pagination) in parallel
- **Phase 4**: T025, T026 (tests) in parallel; T027 can start immediately
- **Phase 5**: All test tasks (T032–T035) in parallel; all contract tasks (T036–T040) in parallel
- **Phase 6**: T047, T048 (tests) in parallel
- **Cross-phase**: US1, US2, US3 can run in parallel after Foundational phase

---

## Parallel Example: User Story 1

```bash
# Step 1: Launch all tests for US1 together (should FAIL):
Task T010: "Contract conformance test for patients"
Task T011: "Contract conformance test for routines"
Task T012: "Contract conformance test for exercises"

# Step 2: Launch all contract definitions together:
Task T013: "Populate patients.ts contracts"
Task T014: "Populate routines.ts contracts"
Task T015: "Populate exercises.ts contracts"

# Step 3: Update API DTOs (sequential per domain, parallel across domains):
Task T016 + T017: "Patient DTOs implement interfaces"
Task T018 + T019: "Routine DTOs implement interfaces"
Task T020 + T021: "Exercise DTOs implement interfaces"

# Step 4: Pagination (parallel across endpoints):
Task T022: "Paginate patients"
Task T023: "Paginate routines"
Task T024: "Paginate exercises"

# Step 5: Re-run tests — should now PASS
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Patients + Routines + Exercises contracts + pagination)
4. **STOP and VALIDATE**: `pnpm build && pnpm test` — all three core domains have canonical contracts
5. Deploy/demo if ready — developers can already import types from `@symma/shared-types`

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (contracts) + US2 (naming fixes) → Core contracts with consistent naming (**MVP!**)
3. US3 (full coverage) → All 9 domains have contracts
4. US4 (mobile sync) → End-to-end Kotlin code-gen pipeline
5. US5 (versioning) → Sustainable evolution process
6. Polish → Web consumers updated, full build green

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (core domain contracts + pagination)
   - Developer B: US2 (naming fixes) + US3 (remaining domain contracts)
3. After US3:
   - Developer A: US4 (mobile sync pipeline)
   - Developer B: US5 (versioning) + Polish (web consumers)
4. All stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing `packages/shared-types/src/index.ts` already has partial definitions (Patient, Routine, Exercise entities + some DTOs + some enums) — these must be migrated to domain-specific files, not duplicated
- `apps/api/src/main.ts` already has `whitelist: true` — only `forbidNonWhitelisted` needs to change from `true` to `false`
