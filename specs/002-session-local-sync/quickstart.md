# Quickstart: Session Local Persistence and Sync

**Branch**: `002-session-local-sync` | **Date**: 2026-02-22

---

## What This Feature Does

When a patient finishes a rehabilitation routine, the app:
1. **Saves the session immediately to local Room DB** (always, regardless of network)
2. **Attempts an immediate upload** to the server if connected
3. **Enqueues a WorkManager job** as a safety net for offline/failed cases
4. **Shows the summary screen** right after local save — no waiting for network

---

## Architecture at a Glance

```
PlayerViewModel
    │
    │ completeSession() → calls SaveAndSyncSessionUseCase
    ▼
SaveAndSyncSessionUseCase
    ├── 1. SessionRepository.saveSession()  ──► Room DB (SessionEntity + SessionItemEntity)
    ├── 2. SessionRepository.syncNow()      ──► Retrofit POST /api/sessions (if online)
    │       ├── success → markSynced()
    │       └── failure → leave PENDING
    └── 3. SyncSessionsWorker.enqueue()     ──► WorkManager (safety net / batch retry)

SyncSessionsWorker (WorkManager, CONNECTED constraint)
    ├── getPendingSessions() from Room
    └── for each PENDING session:
            ├── POST /api/sessions
            ├── 2xx / 409 → markSynced()
            ├── 4xx (not 409) → markError()
            └── network / 5xx → Result.retry() (exponential backoff)
```

---

## Files to Create / Modify

### New Files

| File | Purpose |
|------|---------|
| `data/local/entity/SessionEntity.kt` | Room entity for session header |
| `data/local/entity/SessionItemEntity.kt` | Room entity for per-exercise results |
| `data/local/dao/SessionDao.kt` | Room DAO: insert, query pending, update sync status |
| `data/mapper/SessionMapper.kt` | Maps entity ↔ domain ↔ network DTO |
| `domain/model/Session.kt` | Domain model (no Room/Retrofit deps) |
| `domain/usecase/SaveAndSyncSessionUseCase.kt` | Orchestrates save + immediate sync + WorkManager enqueue |
| `core/sync/SyncSessionsWorker.kt` | WorkManager CoroutineWorker for background batch sync |

### Modified Files

| File | Change |
|------|--------|
| `domain/repository/SessionRepository.kt` | Add `saveSession()`, `getPendingSessions()`, `markSynced()`, `markError()` |
| `data/repository/SessionRepositoryImpl.kt` | Implement new interface; inject SessionDao |
| `core/di/DatabaseModule.kt` | Register new entities, add SessionDao provider, bump DB version to 5 |
| `presentation/player/PlayerViewModel.kt` | Call `SaveAndSyncSessionUseCase` in `completeSession()` |
| `presentation/summary/SummaryViewModel.kt` | Remove direct `submitSession()` call; session already saved upstream |

---

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Sync trigger | Dual: immediate attempt + WorkManager | Online path is instant; WorkManager covers offline + retries |
| Idempotency | Client-generated UUID as session `id` | Prevents duplicates on retry after network timeout |
| 4xx handling | Mark `ERROR`, stop retrying | Prevents infinite loops on permanent server rejections |
| 409 handling | Treat as `SYNCED` | Session already on server from a prior attempt |
| `seriesData` in Room | Store as JSON string with TypeConverter | Room has no native JSON type |

---

## Sync Status State Machine

```
[Session Completed]
       │
       ▼
   PENDING ──── upload OK (2xx / 409) ────► SYNCED (terminal)
       │
       ├──── 4xx error (not 409) ──────────► ERROR  (terminal, no retry)
       │
       └──── network error / 5xx ──────────► PENDING (WorkManager retries with backoff)
```

---

## Testing Strategy

Each new class requires a co-located unit test in `app/src/test/`:

| Test File | What to Test |
|-----------|-------------|
| `SessionDaoTest.kt` | Insert session + items, query PENDING, update sync status |
| `SessionRepositoryImplTest.kt` | saveSession persists locally; syncNow calls API; markSynced/markError update DB |
| `SaveAndSyncSessionUseCaseTest.kt` | Orchestration: save → immediate sync → WorkManager enqueue |
| `SyncSessionsWorkerTest.kt` | Processes PENDING sessions; handles 2xx, 409, 4xx, network errors correctly |
| `SummaryViewModelTest.kt` | No longer calls submitSession; observes correct UI state |

---

## Prerequisites

- Android Gradle dependencies already present: `room`, `work-runtime-ktx`, `hilt-work`
- Verify in `apps/mobile/app/build.gradle.kts` that WorkManager Hilt integration is included:
  ```kotlin
  implementation("androidx.hilt:hilt-work:1.x.x")
  kapt("androidx.hilt:hilt-compiler:1.x.x")
  ```
- `HiltWorkerFactory` must be set in `SymmaApp.kt` (or Application class) via `Configuration.Provider`

---

## Verification Steps

1. **Offline test**: Enable airplane mode → complete a routine → verify summary appears → check Room DB has 1 PENDING session
2. **Sync test**: Re-enable connectivity → wait ≤60s → verify session appears in server (`GET /api/sessions` or Prisma Studio)
3. **Idempotency test**: Manually trigger sync twice for same session → verify only 1 record on server
4. **Error test**: Mock server to return 400 → complete routine → verify session marked `ERROR` in Room, not retried
5. **Batch test**: Complete 3 sessions offline → reconnect → verify all 3 appear on server
