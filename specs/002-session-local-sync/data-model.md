# Data Model: Session Local Persistence and Sync

**Branch**: `002-session-local-sync` | **Date**: 2026-02-22

---

## Overview

This feature introduces two new Room entities (`SessionEntity`, `SessionItemEntity`) and one domain model (`Session`) to the Android app. The server-side Prisma schema already defines the canonical `Session` and `SessionItem` models — the mobile entities mirror them exactly, with the addition of local-only sync metadata fields.

---

## Room Entities (Local Database)

### `SessionEntity`

**Table**: `sessions`  
**Purpose**: Persists one completed routine session locally before and after server sync.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `String` (UUID) | No | — | Locally generated UUID; used as server-side ID for idempotency |
| `routineId` | `String` (UUID) | No | — | FK → `routines.id` (no Room FK enforced; routine may be updated) |
| `startTime` | `Long` (epoch ms) | No | — | Session start timestamp |
| `endTime` | `Long` (epoch ms) | No | — | Session end timestamp |
| `durationSeconds` | `Int` | No | — | `(endTime - startTime) / 1000` |
| `score` | `Float` | No | `0f` | Overall session score (average accuracy across items) |
| `syncStatus` | `String` | No | `"PENDING"` | Enum: `PENDING`, `SYNCED`, `ERROR` |
| `syncedAt` | `Long` | Yes | `null` | Epoch ms when successfully synced; null if not yet synced |
| `createdAt` | `Long` | No | `System.currentTimeMillis()` | Local creation timestamp |

**Indices**: `syncStatus` (for efficient pending query)

---

### `SessionItemEntity`

**Table**: `session_items`  
**Purpose**: Persists the result of one exercise within a session.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | `String` (UUID) | No | — | Locally generated UUID |
| `sessionId` | `String` (UUID) | No | — | FK → `sessions.id` (CASCADE delete) |
| `exerciseId` | `String` (UUID) | No | — | FK → `exercises.id` (no Room FK; exercise catalog may change) |
| `repsCompleted` | `Int` | No | — | Actual reps completed by patient |
| `difficulty` | `Int` | No | `0` | Difficulty level recorded at time of exercise |
| `averageAccuracy` | `Float` | Yes | `null` | Average symmetry/accuracy score (0.0–1.0) |
| `seriesData` | `String` | Yes | `null` | JSON-serialized detailed series data (Gson TypeConverter) |

**Foreign Keys**: `sessionId` → `sessions.id` with `CASCADE` on delete  
**Indices**: `sessionId`

---

### `SyncStatus` Enum (Kotlin)

```
PENDING  → session saved locally, not yet uploaded
SYNCED   → successfully uploaded to server (terminal success)
ERROR    → permanently rejected by server 4xx (terminal failure, no retry)
```

State transitions:
- `PENDING` → `SYNCED`: server returns 2xx or 409 (already exists)
- `PENDING` → `ERROR`: server returns 4xx (except 409)
- `PENDING` → `PENDING`: network error or 5xx (WorkManager retries)
- `SYNCED` / `ERROR` → no further transitions

---

## Domain Model

### `Session` (domain layer)

**Purpose**: Clean domain representation passed between use cases and ViewModels. Does not expose Room or network details.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | UUID |
| `routineId` | `String` | UUID |
| `startTime` | `Long` | Epoch ms |
| `endTime` | `Long` | Epoch ms |
| `durationSeconds` | `Int` | |
| `score` | `Float` | |
| `syncStatus` | `SyncStatus` | Enum |
| `items` | `List<SessionItem>` | Nested domain items |

### `SessionItem` (domain layer)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` | UUID |
| `exerciseId` | `String` | UUID |
| `repsCompleted` | `Int` | |
| `difficulty` | `Int` | |
| `averageAccuracy` | `Float?` | |

---

## Mapper: Entity ↔ Domain ↔ Network DTO

### `SessionEntity` → `CreateSessionRequest` (for API upload)

```
SessionEntity.id            → CreateSessionRequest.id (optional, for idempotency)
SessionEntity.routineId     → CreateSessionRequest.routineId
SessionEntity.startTime     → CreateSessionRequest.startTime (ISO-8601 string)
SessionEntity.endTime       → CreateSessionRequest.endTime (ISO-8601 string)
SessionItemEntity[]         → CreateSessionRequest.items[]
  .exerciseId               →   .exerciseId
  .repsCompleted            →   .repsCompleted
  .difficulty               →   .difficulty
  .averageAccuracy          →   .averageAccuracy
  .seriesData (JSON string) →   .seriesData (deserialized Any?)
```

### `List<SessionItemRequest>` (from PlayerViewModel) → `SessionItemEntity`

```
SessionItemRequest.exerciseId       → SessionItemEntity.exerciseId
SessionItemRequest.repsCompleted    → SessionItemEntity.repsCompleted
SessionItemRequest.difficulty       → SessionItemEntity.difficulty
SessionItemRequest.averageAccuracy  → SessionItemEntity.averageAccuracy
SessionItemRequest.seriesData       → SessionItemEntity.seriesData (JSON string)
```

---

## DAO Interface: `SessionDao`

| Method | Return | Description |
|--------|--------|-------------|
| `insertSession(session: SessionEntity)` | `suspend Unit` | Insert new session |
| `insertSessionItems(items: List<SessionItemEntity>)` | `suspend Unit` | Insert items for a session |
| `getPendingSessions()` | `suspend List<SessionEntity>` | All sessions with `syncStatus = PENDING` |
| `getItemsForSession(sessionId: String)` | `suspend List<SessionItemEntity>` | Items for a given session |
| `updateSyncStatus(id: String, status: String, syncedAt: Long?)` | `suspend Unit` | Update sync state after upload attempt |

---

## Database Version

Current `SymmaDatabase` version: **4**  
New version after this feature: **5**

Migration strategy: `fallbackToDestructiveMigration()` is already configured (development phase). No manual migration needed.

---

## Server-Side Schema (reference, no changes required)

The Prisma schema in `packages/database/prisma/schema.prisma` already defines:

```prisma
model Session {
  id              String        @id @default(uuid())
  routineId       String        @map("routine_id")
  date            DateTime
  durationSeconds Int           @map("duration_seconds")
  score           Float
  items           SessionItem[]
  isSynced        Boolean       @default(false) @map("is_synced")
  createdAt       DateTime      @default(now()) @map("created_at")
  routine         Routine       @relation(fields: [routineId], references: [id], onDelete: Cascade)
}

model SessionItem {
  id              String   @id @default(uuid())
  sessionId       String   @map("session_id")
  exerciseId      String   @map("exercise_id")
  repsCompleted   Int      @map("reps_completed")
  difficulty      Int      @default(0)
  averageAccuracy Float?   @map("average_accuracy")
  seriesData      Json?    @map("series_data")
}
```

**Note**: The server's `isSynced` field tracks whether the server has processed the session for analytics — it is independent of the mobile `syncStatus` field which tracks upload state.
