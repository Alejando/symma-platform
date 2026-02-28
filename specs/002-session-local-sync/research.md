# Research: Session Local Persistence and Sync

**Branch**: `002-session-local-sync` | **Date**: 2026-02-22  
**Phase**: 0 — Resolve unknowns before design

---

## 1. WorkManager vs. Alternatives for Background Sync

**Decision**: Use **WorkManager** with a `CoroutineWorker` and `NetworkType.CONNECTED` constraint.

**Rationale**:
- WorkManager is the Android-recommended API for deferrable, guaranteed background work. It persists work across app restarts and device reboots.
- `NetworkType.CONNECTED` constraint ensures the worker only runs when connectivity is available — no manual connectivity polling needed.
- `CoroutineWorker` integrates natively with Kotlin coroutines and the existing Hilt DI setup.
- Foreground services are not needed — session sync is deferrable (not time-critical to the second).
- AlarmManager is not appropriate (deprecated for this use case, battery-hostile).
- JobScheduler is the underlying mechanism WorkManager uses on API 23+; using WorkManager directly is the correct abstraction.

**Alternatives considered**:
- **Foreground Service**: Rejected — overkill for deferrable sync; requires persistent notification which degrades UX.
- **Manual connectivity listener + coroutine**: Rejected — not guaranteed across process death; WorkManager handles this automatically.

---

## 2. Sync Trigger Strategy: Eager + Background

**Decision**: **Dual trigger** — attempt immediate sync after saving locally, AND enqueue a WorkManager job as a safety net.

**Rationale**:
- Immediate attempt (in `SaveAndSyncSessionUseCase`) covers the happy path (online) with zero latency.
- WorkManager job covers the offline case and retries after failures.
- The WorkManager job queries all `PENDING` sessions, so it handles both the just-saved session and any previously accumulated ones.
- Using `ExistingWorkPolicy.KEEP` ensures only one sync worker runs at a time, preventing concurrent uploads.

**Alternatives considered**:
- **WorkManager only (no immediate attempt)**: Rejected — adds unnecessary delay in the online case; user would wait up to WorkManager's scheduling window.
- **Immediate attempt only (no WorkManager)**: Rejected — violates FR-005 (automatic retry) and the Offline-First constitution principle.

---

## 3. Idempotency and Duplicate Prevention

**Decision**: Generate a **stable local UUID** for each session at creation time and include it as the session's `id` in the API request. The server uses this as the primary key (already UUID-based per Prisma schema).

**Rationale**:
- The Prisma `Session` model uses `@id @default(uuid())` — the server generates IDs by default. To support idempotency, the mobile app must generate the UUID locally and send it.
- If the network times out after the server has already persisted the session, the retry will attempt to insert a duplicate UUID, which the server can reject with a 409 Conflict. The mobile app treats 409 as a success (session was already synced) and marks it `SYNCED`.
- This avoids duplicate sessions on the server without requiring a separate idempotency key header.

**Alternatives considered**:
- **Server-generated ID, no idempotency**: Rejected — retries after timeout create duplicates (violates SC-005).
- **Idempotency-Key HTTP header**: Valid alternative, but requires API changes. Client-generated UUID is simpler and consistent with the existing UUID-based schema.

**API impact**: The `POST /api/sessions` endpoint needs to accept an optional `id` field. If `id` is provided and already exists, return 409. This is a minor, backward-compatible API change.

---

## 4. Sync Status State Machine

**Decision**: Three states stored as a string enum in Room: `PENDING`, `SYNCED`, `ERROR`.

```
PENDING ──(upload success)──► SYNCED
PENDING ──(4xx error)────────► ERROR
PENDING ──(network error)────► PENDING  (WorkManager retries)
ERROR   ──(no transition)────► ERROR    (permanent, no retry)
```

**Rationale**:
- `PENDING`: default state on creation; WorkManager will pick up all sessions in this state.
- `SYNCED`: terminal success state; never re-uploaded.
- `ERROR`: terminal failure state for permanent server rejections (400, 422, 404). Prevents infinite retry loops.
- Network errors (timeout, 5xx) leave the session in `PENDING` — WorkManager's built-in retry with backoff handles these.
- 409 Conflict is treated as `SYNCED` (already uploaded successfully in a prior attempt).

**Alternatives considered**:
- **Boolean `is_synced` only**: Rejected — cannot distinguish between "never tried", "failed permanently", and "succeeded". The constitution requires `is_synced` flag; we extend it with a richer enum while keeping the boolean semantics for the server-side Prisma model.

---

## 5. Room Schema Design for Sessions

**Decision**: Two new Room entities mirroring the Prisma schema exactly:

- `SessionEntity` — maps to `sessions` table; adds `syncStatus: String` and `syncedAt: Long?` fields not present in Prisma (local-only metadata).
- `SessionItemEntity` — maps to `session_items` table; foreign key to `SessionEntity` with CASCADE delete.

**Rationale**:
- Mirroring Prisma entities is mandated by Constitution Principle IV.
- `syncStatus` and `syncedAt` are local-only fields (not sent to server) — they track sync lifecycle.
- `seriesData` is stored as a JSON string in Room (Room does not natively support `Json` type; use `@TypeConverter` with Gson).
- The `SessionEntity.id` is the locally-generated UUID (used as the server-side ID for idempotency).

---

## 6. Data Flow: PlayerViewModel → Repository

**Decision**: `PlayerViewModel` passes `sessionResults: List<SessionItemRequest>` to `SaveAndSyncSessionUseCase` at session completion. The use case handles persistence and sync trigger.

**Rationale**:
- `PlayerViewModel` already accumulates `sessionResults` (a `mutableListOf<SessionItemRequest>`) during the session.
- The `completeSession()` method already has a `TODO` for triggering upload — this is the integration point.
- The ViewModel calls the use case and navigates to the summary screen immediately after the local save completes (not after sync).
- `SummaryViewModel` is simplified — it no longer needs to call `submitSession()` directly; it only observes the sync status if needed.

---

## 7. WorkManager Retry Policy

**Decision**: `BackoffPolicy.EXPONENTIAL` with initial delay of 30 seconds, max retries via `Result.retry()` for network errors.

**Rationale**:
- Exponential backoff prevents hammering the server during outages.
- WorkManager's default max attempts (10) is sufficient for the expected use case.
- `Result.failure()` (permanent failure) is returned only for 4xx errors, which triggers the `ERROR` state transition.
- `Result.retry()` is returned for network exceptions and 5xx errors.

---

## 8. Existing Code Impact Assessment

| File | Change Type | Reason |
|------|-------------|--------|
| `SessionRepositoryImpl.kt` | **Replace** | Currently API-only; must add Room DAO injection and local-first logic |
| `SessionRepository.kt` | **Update** | Add `saveSession()`, `getPendingSessions()`, `markSynced()`, `markError()` |
| `SummaryViewModel.kt` | **Simplify** | Remove direct `submitSession()` call; session already saved by PlayerViewModel |
| `PlayerViewModel.kt` | **Update** | Call `SaveAndSyncSessionUseCase` in `completeSession()` instead of TODO |
| `DatabaseModule.kt` | **Update** | Register `SessionEntity`, `SessionItemEntity`, `SessionDao`; bump DB version |
| `SymmaDatabase` | **Update** | Add new entities and DAO abstract function |

---

## 9. No API Changes Required (except optional idempotency)

The existing `POST /api/sessions` endpoint in `apps/api/src/sessions/sessions.controller.ts` already:
- Accepts `routineId`, `startTime`, `endTime`, `items[]` (with `exerciseId`, `repsCompleted`, `difficulty`, `averageAccuracy`, `seriesData`)
- Is protected by `jwt-patient` auth guard
- Returns 201 on success

The only recommended API change is accepting an optional `id` field for idempotency (see Decision 3). This is a minor enhancement, not a blocker for the mobile implementation.
