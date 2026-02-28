# Tasks: Session Local Persistence and Sync

**Input**: Design documents from `/specs/002-session-local-sync/`
**Branch**: `002-session-local-sync`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Required per Constitution Principle V (Test-Driven Quality — NON-NEGOTIABLE).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Gap Analysis: API Contract Alignment

Before mobile implementation, the following mismatches between `packages/shared-types`, the API, and the mobile DTO must be resolved:

| Gap | Location | Action Required |
|-----|----------|----------------|
| `CreateSessionRequest` missing `id` field (for idempotency) | `shared-types/src/sessions.ts`, `api/sessions/dto/create-session.dto.ts`, `mobile/CreateSessionRequest.kt` | Add optional `id?: string` to all three |
| `SessionItemRequest` missing `seriesData` in API service | `api/sessions/sessions.service.ts` | Persist `seriesData` in `prisma.session.create` |
| API does not handle 409 Conflict for duplicate session `id` | `api/sessions/sessions.service.ts` | Add idempotency check before insert |
| Mobile `CreateSessionRequest.kt` sends `items: emptyList()` | `data/repository/SessionRepositoryImpl.kt` | Replace with real items from Room |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the Room schema foundation and verify API contract alignment before any user story work.

- [X] T001 Add optional `id?: string` field to `CreateSessionRequest` interface in `packages/shared-types/src/sessions.ts`
- [X] T002 Add optional `id?: string` field to `CreateSessionDto` class in `apps/api/src/sessions/dto/create-session.dto.ts` (decorated with `@IsUUID()`, `@IsOptional()`)
- [X] T003 Update `SessionsService.create()` in `apps/api/src/sessions/sessions.service.ts` to: (a) check if session with provided `id` already exists and return it (409-equivalent idempotency), (b) use client-provided `id` as primary key when present, (c) persist `seriesData` in `items.create`
- [X] T004 Write unit test for idempotency logic in `apps/api/src/sessions/sessions.service.spec.ts` — verify that calling `create()` twice with the same `id` returns the existing session without creating a duplicate
- [X] T005 [P] Create `SyncStatus` enum in `apps/mobile/app/src/main/java/com/symma/app/domain/model/SyncStatus.kt` with values `PENDING`, `SYNCED`, `ERROR`
- [X] T006 [P] Create `SessionEntity` Room entity in `apps/mobile/app/src/main/java/com/symma/app/data/local/entity/SessionEntity.kt` — fields: `id`, `routineId`, `startTime`, `endTime`, `durationSeconds`, `score`, `syncStatus`, `syncedAt`, `createdAt`; index on `syncStatus`
- [X] T007 [P] Create `SessionItemEntity` Room entity in `apps/mobile/app/src/main/java/com/symma/app/data/local/entity/SessionItemEntity.kt` — fields: `id`, `sessionId` (FK → sessions CASCADE), `exerciseId`, `repsCompleted`, `difficulty`, `averageAccuracy`, `seriesData` (JSON string); index on `sessionId`
- [X] T008 [P] Add `id?: String` field to `CreateSessionRequest` data class in `apps/mobile/app/src/main/java/com/symma/app/data/remote/dto/session/CreateSessionRequest.kt` (annotated with `@SerializedName("id")`)
- [X] T009 Update `SymmaDatabase` in `apps/mobile/app/src/main/java/com/symma/app/core/di/DatabaseModule.kt` — add `SessionEntity` and `SessionItemEntity` to `@Database(entities=[...])`, add abstract `fun sessionDao(): SessionDao`, bump version from 4 to 5

**Checkpoint**: Room schema defined, API contract aligned across shared-types + API + mobile DTO. Foundation ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data layer that ALL user stories depend on — DAO, domain model, mapper, repository interface.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T010 Create `SessionDao` interface in `apps/mobile/app/src/main/java/com/symma/app/data/local/dao/SessionDao.kt` with methods: `insertSession(SessionEntity)`, `insertSessionItems(List<SessionItemEntity>)`, `getPendingSessions(): List<SessionEntity>`, `getItemsForSession(sessionId: String): List<SessionItemEntity>`, `updateSyncStatus(id: String, status: String, syncedAt: Long?)`
- [X] T011 [P] Create domain model `Session` data class in `apps/mobile/app/src/main/java/com/symma/app/domain/model/Session.kt` — fields: `id`, `routineId`, `startTime`, `endTime`, `durationSeconds`, `score`, `syncStatus: SyncStatus`, `items: List<SessionItem>`
- [X] T012 [P] Create domain model `SessionItem` data class in `apps/mobile/app/src/main/java/com/symma/app/domain/model/SessionItem.kt` — fields: `id`, `exerciseId`, `repsCompleted`, `difficulty`, `averageAccuracy: Float?`
- [X] T013 Create `SessionMapper.kt` in `apps/mobile/app/src/main/java/com/symma/app/data/mapper/SessionMapper.kt` with extension functions: `SessionItemRequest.toEntity(sessionId)`, `SessionEntity.toCreateRequest(items: List<SessionItemEntity>): CreateSessionRequest`, `SessionEntity.toDomain(items: List<SessionItemEntity>): Session`
- [X] T014 Update `SessionRepository` interface in `apps/mobile/app/src/main/java/com/symma/app/domain/repository/SessionRepository.kt` — replace current `submitSession()` with: `saveSession(routineId, startTime, endTime, durationSeconds, score, items): Result<String>` (returns local session id), `getPendingSessions(): List<Session>`, `syncSession(sessionId: String): Result<Unit>`, `markSynced(sessionId: String)`, `markError(sessionId: String)`
- [X] T015 Add `SessionDao` provider to `DatabaseModule` in `apps/mobile/app/src/main/java/com/symma/app/core/di/DatabaseModule.kt` — `@Provides @Singleton fun provideSessionDao(db: SymmaDatabase): SessionDao`
- [X] T016 Write unit test for `SessionDao` in `apps/mobile/app/src/test/java/com/symma/app/data/local/dao/SessionDaoTest.kt` — test insert, getPendingSessions returns only PENDING, updateSyncStatus transitions correctly
- [X] T017 [P] Write unit test for `SessionMapper` in `apps/mobile/app/src/test/java/com/symma/app/data/mapper/SessionMapperTest.kt` — verify `toEntity`, `toCreateRequest` (includes `id` field and correct ISO-8601 timestamps), `toDomain`

**Checkpoint**: DAO, domain models, mapper, and repository interface complete. User story implementation can begin.

---

## Phase 3: User Story 1 - Complete Routine Without Internet (Priority: P1) 🎯 MVP

**Goal**: Session data is saved locally immediately upon completion and auto-synced when connectivity returns. Patient always sees the summary screen without delay.

**Independent Test**: Enable airplane mode → complete a routine → verify summary appears → check Room has 1 PENDING session → re-enable connectivity → wait ≤60s → verify session appears on server.

### Implementation for User Story 1

- [X] T018 Rewrite `SessionRepositoryImpl` in `apps/mobile/app/src/main/java/com/symma/app/data/repository/SessionRepositoryImpl.kt` — inject `SessionDao` and `SymmaApiService`; implement `saveSession()` (generate UUID, insert `SessionEntity` + `SessionItemEntity` with status `PENDING`); implement `syncSession()` (call `POST /api/sessions` with client-generated `id`, handle 2xx→`markSynced`, 409→`markSynced`, 4xx→`markError`, network/5xx→`Result.failure`); implement `getPendingSessions()`, `markSynced()`, `markError()`
- [X] T019 Create `SaveAndSyncSessionUseCase` in `apps/mobile/app/src/main/java/com/symma/app/domain/usecase/SaveAndSyncSessionUseCase.kt` — (1) call `sessionRepository.saveSession()`, (2) attempt `sessionRepository.syncSession()` immediately (fire-and-forget, do not block), (3) enqueue `SyncSessionsWorker` via WorkManager with `NetworkType.CONNECTED` constraint and `ExistingWorkPolicy.KEEP`; return the local session id after step 1
- [X] T020 Create `SyncSessionsWorker` in `apps/mobile/app/src/main/java/com/symma/app/core/sync/SyncSessionsWorker.kt` — extend `CoroutineWorker`; annotate with `@HiltWorker`; inject `SessionRepository`; in `doWork()`: call `getPendingSessions()`, for each PENDING session call `syncSession()`, return `Result.success()` if all done, `Result.retry()` if any network/5xx failures remain; use `BackoffPolicy.EXPONENTIAL` with 30s initial delay
- [X] T021 Update `PlayerViewModel.completeSession()` in `apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt` — inject `SaveAndSyncSessionUseCase`; replace the `TODO` comment with a call to `saveAndSyncSessionUseCase(routineId, startTime, endTime, durationSeconds, score, sessionResults)`; navigate to summary immediately after use case returns (do not await sync)
- [X] T022 Simplify `SummaryViewModel` in `apps/mobile/app/src/main/java/com/symma/app/presentation/summary/SummaryViewModel.kt` — remove `SessionRepository` injection and `submitSession()` call; set `_uiState` to `SummaryUiState.Success` directly on init (session already saved by PlayerViewModel); keep `routineId` and `durationSeconds` from `SavedStateHandle` for display
- [X] T023 Register `HiltWorkerFactory` in `apps/mobile/app/src/main/java/com/symma/app/SymmaApp.kt` — implement `Configuration.Provider`, override `workManagerConfiguration` to use `HiltWorkerFactory`; verify `androidx.hilt:hilt-work` dependency is present in `apps/mobile/app/build.gradle.kts`
- [X] T024 Write unit test for `SessionRepositoryImpl` in `apps/mobile/app/src/test/java/com/symma/app/data/repository/SessionRepositoryImplTest.kt` — mock `SessionDao` and `SymmaApiService`; test: `saveSession` inserts with PENDING status; `syncSession` marks SYNCED on 2xx; `syncSession` marks SYNCED on 409; `syncSession` marks ERROR on 400; `syncSession` returns failure (stays PENDING) on IOException
- [X] T025 [P] Write unit test for `SaveAndSyncSessionUseCase` in `apps/mobile/app/src/test/java/com/symma/app/domain/usecase/SaveAndSyncSessionUseCaseTest.kt` — mock `SessionRepository` and `WorkManager`; verify save is called before sync; verify WorkManager enqueue is called with CONNECTED constraint; verify local id is returned immediately
- [X] T026 [P] Write unit test for `SyncSessionsWorker` in `apps/mobile/app/src/test/java/com/symma/app/core/sync/SyncSessionsWorkerTest.kt` — mock `SessionRepository`; test: all PENDING sessions are processed; 2xx → SYNCED; 409 → SYNCED; 4xx → ERROR; network error → `Result.retry()`
- [X] T027 Write unit test for `SummaryViewModel` in `apps/mobile/app/src/test/java/com/symma/app/presentation/summary/SummaryViewModelTest.kt` — verify `uiState` is immediately `Success` on init without any repository call

**Checkpoint**: US1 complete. Offline save + background sync fully functional. Verify with airplane mode test from quickstart.md.

---

## Phase 4: User Story 2 - Complete Routine With Internet (Priority: P2)

**Goal**: When online, the immediate sync attempt in `SaveAndSyncSessionUseCase` succeeds and the session is marked SYNCED before WorkManager even runs.

**Independent Test**: Complete a routine with active internet → summary appears immediately → session visible on server within seconds → Room record shows `SYNCED`.

### Implementation for User Story 2

- [X] T028 [US2] Verify `SaveAndSyncSessionUseCase` immediate sync path works end-to-end: add integration log in `SessionRepositoryImpl.syncSession()` confirming the immediate attempt is made before WorkManager fires — no code change needed if T018/T019 implemented correctly; this is a validation task
- [X] T029 [US2] Add `syncedAt` timestamp population in `SessionRepositoryImpl.markSynced()` in `apps/mobile/app/src/main/java/com/symma/app/data/repository/SessionRepositoryImpl.kt` — set `syncedAt = System.currentTimeMillis()` when transitioning to SYNCED
- [X] T030 [P] [US2] Update `SessionRepositoryImplTest` in `apps/mobile/app/src/test/java/com/symma/app/data/repository/SessionRepositoryImplTest.kt` — add test: `markSynced` sets non-null `syncedAt`; `markError` leaves `syncedAt` null

**Checkpoint**: US1 + US2 complete. Both online and offline paths verified.

---

## Phase 5: User Story 3 - Pending Sessions Sync on App Reopen (Priority: P3)

**Goal**: Multiple sessions accumulated offline are all uploaded in a single WorkManager run when the app reopens with connectivity.

**Independent Test**: Complete 3 sessions in airplane mode → re-enable connectivity → open app → all 3 sessions appear on server; verify no duplicates.

### Implementation for User Story 3

- [X] T031 [US3] Verify `SyncSessionsWorker.doWork()` processes ALL pending sessions in a loop (not just one) — review T020 implementation; if it only processes one session, update the loop in `apps/mobile/app/src/main/java/com/symma/app/core/sync/SyncSessionsWorker.kt` to iterate all PENDING sessions before returning `Result.success()`
- [X] T032 [US3] Ensure WorkManager job is also enqueued on app startup (not only after session completion) — add `SyncSessionsWorker` enqueue call in `SymmaApp.onCreate()` in `apps/mobile/app/src/main/java/com/symma/app/SymmaApp.kt` using `ExistingWorkPolicy.KEEP` so it only runs if not already queued
- [X] T033 [P] [US3] Update `SyncSessionsWorkerTest` in `apps/mobile/app/src/test/java/com/symma/app/core/sync/SyncSessionsWorkerTest.kt` — add test: given 3 PENDING sessions, all 3 are processed; given 2 succeed and 1 fails with network error, `Result.retry()` is returned and the 2 successful ones are SYNCED

**Checkpoint**: All 3 user stories complete. Full offline-first lifecycle verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, cleanup, and validation across all stories.

- [X] T034 Add `@TypeConverter` for `seriesData` JSON serialization in `apps/mobile/app/src/main/java/com/symma/app/data/local/entity/SessionItemEntity.kt` (or a dedicated `Converters.kt`) — use Gson to convert `Any?` ↔ `String?` for Room storage (N/A: seriesData stored as String?, JSON handled in mapper)
- [X] T035 [P] Add `@Index` annotation on `SessionEntity.syncStatus` column in `apps/mobile/app/src/main/java/com/symma/app/data/local/entity/SessionEntity.kt` to optimize `getPendingSessions()` query
- [X] T036 [P] Verify `apps/mobile/app/build.gradle.kts` has all required dependencies: `androidx.hilt:hilt-work`, `androidx.hilt:hilt-compiler`, `androidx.work:work-runtime-ktx`; add any missing ones
- [X] T037 Remove dead code: delete the old `submitSession(routineId, durationSeconds)` method from `SessionRepository` interface and its implementation if it still exists after T014/T018 (already removed in T014)
- [X] T038 [P] Update `packages/shared-types/src/sessions.ts` — add JSDoc comment on `id` field clarifying it is client-generated for idempotency and optional for backward compatibility
- [ ] T039 Run all unit tests to confirm green: `./gradlew :app:testDebugUnitTest` in `apps/mobile`
- [ ] T040 Execute manual verification steps from `specs/002-session-local-sync/quickstart.md` — offline test, sync test, idempotency test, error test, batch test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001–T004 (API contract) can be done in parallel with T005–T009 (mobile schema).
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories.
- **Phase 3 (US1)**: Depends on Phase 2 — this is the MVP. All T024–T027 tests can be written before T018–T023 implementation.
- **Phase 4 (US2)**: Depends on Phase 3 — minimal delta, mostly validation.
- **Phase 5 (US3)**: Depends on Phase 3 — WorkManager loop and startup enqueue.
- **Phase 6 (Polish)**: Depends on Phases 3–5.

### API vs Mobile Parallelism

- **T001–T004** (API contract alignment) can be done in parallel with **T005–T009** (mobile Room schema) — different codebases.
- Once T001–T002 are done, the mobile mapper (T013) can use the updated `CreateSessionRequest` with `id`.

### Within Each User Story

- Tests (T024–T027, T030, T033) MUST be written before or alongside implementation — they should FAIL before implementation is complete.
- Entities (T006, T007) before DAO (T010) before Repository (T018).
- Repository (T018) before UseCase (T019) before ViewModel (T021, T022).

### Parallel Opportunities

```
Phase 1 parallel group A (API):     T001 → T002 → T003 → T004
Phase 1 parallel group B (Mobile):  T005, T006, T007, T008 (all parallel) → T009

Phase 2 parallel:                   T010 → T011, T012 (parallel) → T013 → T014 → T015
                                    T016, T017 (parallel, alongside above)

Phase 3 parallel:                   T024, T025, T026, T027 (all parallel, write first)
                                    T018 → T019 → T020 (sequential)
                                    T021, T022, T023 (parallel after T019)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: API contract alignment + Room schema setup
2. Complete Phase 2: DAO, domain models, mapper, repository interface
3. Complete Phase 3: Full US1 implementation + tests
4. **STOP and VALIDATE**: Airplane mode test from quickstart.md
5. US1 delivers zero data loss — this alone is production-ready value

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Offline save + background sync → **MVP**
3. Phase 4 (US2) → Online immediate sync validated
4. Phase 5 (US3) → Batch sync on app reopen
5. Phase 6 → Polish and hardening

---

## Notes

- **Constitution V (Test-Driven Quality)**: Every new class has a co-located test. Tests must fail before implementation.
- **Idempotency**: The `id` field added in T001–T002 is optional and backward-compatible — existing API clients not sending `id` continue to work normally.
- **DB version bump**: `SymmaDatabase` version 4 → 5 in T009. `fallbackToDestructiveMigration()` is already configured — no manual migration needed in development.
- **`seriesData` in Room**: Stored as JSON string via `@TypeConverter` (T034). The mapper (T013) handles serialization/deserialization.
- **WorkManager `ExistingWorkPolicy.KEEP`**: Prevents multiple concurrent sync workers. Safe to enqueue on every session completion and on app startup.
- Commit after each phase checkpoint to enable easy rollback.
