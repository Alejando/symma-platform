# Implementation Plan: Session Local Persistence and Sync

**Branch**: `002-session-local-sync` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-session-local-sync/spec.md`

## Summary

Implement an offline-first session persistence layer for the Android mobile app. When a patient completes a rehabilitation routine, the session data (exercises, reps, accuracy scores) is immediately saved to the local Room database with a `PENDING` sync status. A WorkManager background task then uploads all pending sessions to the API server (`POST /api/sessions`) whenever connectivity is available, marking each session `SYNCED` on success or `ERROR` on permanent server rejection (4xx). The patient always sees the completion summary immediately — network state never blocks the UI.

## Technical Context

**Language/Version**: Kotlin (JVM 17, Min SDK 26, Target SDK 34)  
**Primary Dependencies**: Room (local DB), WorkManager (background sync), Retrofit + OkHttp (HTTP), Hilt (DI), Kotlin Coroutines + Flow  
**Storage**: Room (SQLite, encrypted via SQLCipher per constitution) — local source of truth; PostgreSQL on server via NestJS API  
**Testing**: JUnit 4 + MockK + Turbine (Flows) — co-located in `app/src/test/`  
**Target Platform**: Android (Min SDK 26+)  
**Project Type**: Mobile (Android MVVM + Clean Architecture)  
**Performance Goals**: Session save to local DB < 100ms; summary screen visible < 1s after session completion; background sync completes < 30s per session  
**Constraints**: Offline-capable (no network required for session save); zero data loss; no duplicate uploads; 4xx errors must not trigger infinite retries  
**Scale/Scope**: Single patient per device; sessions accumulate over days/weeks; batch sync of up to ~30 pending sessions expected in worst case

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Patient Privacy First** | ✅ PASS | Session data stays on-device until explicitly synced over TLS 1.3. No raw video/frames involved. Room DB must use SQLCipher (existing requirement). |
| **II. Offline-First Mobile** | ✅ PASS | This feature directly implements the principle: Room as source of truth, WorkManager for sync, `is_synced` flag on every session entity. |
| **III. On-Device Computer Vision** | ✅ N/A | CV pipeline not modified; this feature only persists its output. |
| **IV. Type Safety Across Boundaries** | ✅ PASS | Kotlin data classes mirror Prisma `Session` + `SessionItem` entities. `CreateSessionRequest` DTO already defined in mobile and matches `@symma/shared-types`. |
| **V. Test-Driven Quality** | ✅ PASS | Unit tests required for: `SessionDao`, `SessionRepositoryImpl`, `SyncSessionsWorker`, `SummaryViewModel`. All co-located in `app/src/test/`. |
| **VI. Clinical Accuracy** | ✅ PASS | All per-exercise results (reps, accuracy, difficulty) captured and persisted. No scoring logic changed. |
| **VII. Monorepo Cohesion** | ✅ PASS | Changes scoped to `apps/mobile`. No new packages needed. Existing `packages/database` Prisma schema already has `Session` + `SessionItem` models. |

**Post-design re-check**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-session-local-sync/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   └── session-sync-api.yaml
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
apps/mobile/app/src/main/java/com/symma/app/
├── data/
│   ├── local/
│   │   ├── dao/
│   │   │   ├── RoutineDao.kt              (existing)
│   │   │   └── SessionDao.kt              ← NEW
│   │   └── entity/
│   │       ├── RoutineEntity.kt           (existing)
│   │       ├── SessionEntity.kt           ← NEW
│   │       └── SessionItemEntity.kt       ← NEW
│   ├── mapper/
│   │   └── SessionMapper.kt               ← NEW
│   └── repository/
│       ├── SessionRepositoryImpl.kt       ← REPLACE (add Room + WorkManager)
│       └── RoutineRepositoryImpl.kt       (existing)
├── domain/
│   ├── model/
│   │   └── Session.kt                     ← NEW (domain model)
│   ├── repository/
│   │   └── SessionRepository.kt           ← UPDATE (add saveSession, getPending)
│   └── usecase/
│       └── SaveAndSyncSessionUseCase.kt   ← NEW
├── core/
│   ├── di/
│   │   └── DatabaseModule.kt              ← UPDATE (add SessionDao, new entities)
│   └── sync/
│       └── SyncSessionsWorker.kt          ← NEW (WorkManager Worker)
└── presentation/
    └── summary/
        └── SummaryViewModel.kt            ← UPDATE (use SaveAndSyncSessionUseCase)

apps/mobile/app/src/test/java/com/symma/app/
├── data/
│   ├── local/dao/
│   │   └── SessionDaoTest.kt              ← NEW
│   └── repository/
│       └── SessionRepositoryImplTest.kt   ← NEW
├── domain/usecase/
│   └── SaveAndSyncSessionUseCaseTest.kt   ← NEW
├── core/sync/
│   └── SyncSessionsWorkerTest.kt          ← NEW
└── presentation/summary/
    └── SummaryViewModelTest.kt            ← NEW (update existing if present)
```

**Structure Decision**: Mobile-only change (Option 3 variant). No API changes required — the `POST /api/sessions` endpoint already exists and accepts the correct payload. The `packages/database` Prisma schema already defines `Session` and `SessionItem` with `is_synced`. This plan adds the missing Room layer and WorkManager sync on the Android side only.

## Complexity Tracking

> No constitution violations detected. Table not required.
