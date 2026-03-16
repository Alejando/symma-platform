# Data Model: Session Detail View & Interactive Analytics Chart

**Feature**: 003-session-analytics-view  
**Phase**: 1 — Design  
**Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

---

## Overview

No new database tables or Prisma schema changes are required. This feature works exclusively with existing models (`Session`, `SessionItem`, `Exercise`, `Routine`). Changes are limited to:

1. New API response shapes (read-only projections of existing data)
2. New shared-type interfaces
3. A new read endpoint in the API
4. Enrichment of the existing history endpoint

---

## Existing Models (read-only, no schema changes)

### Session

| Field            | Type      | Notes                                |
|------------------|-----------|--------------------------------------|
| `id`             | UUID      | Primary key                          |
| `routineId`      | UUID FK   | References `Routine.id`              |
| `date`           | DateTime  | Session execution timestamp          |
| `durationSeconds`| Int       | Total session length in seconds      |
| `score`          | Float     | Overall score 0.0–1.0 (stored)       |
| `isSynced`       | Boolean   | Mobile sync flag                     |
| `createdAt`      | DateTime  | Record creation timestamp            |
| `items`          | Relation  | → `SessionItem[]`                    |

### SessionItem

| Field             | Type       | Notes                                     |
|-------------------|------------|-------------------------------------------|
| `id`              | UUID       | Primary key                               |
| `sessionId`       | UUID FK    | References `Session.id`                   |
| `exerciseId`      | UUID FK    | References `Exercise.id`                  |
| `repsCompleted`   | Int        | Actual reps done                          |
| `difficulty`      | Int        | Difficulty level (0–n)                    |
| `averageAccuracy` | Float?     | Symmetry score 0–100, nullable            |
| `seriesData`      | Json?      | Per-rep accuracy array, nullable          |
| `exercise`        | Relation   | → `Exercise` (for name join)              |

### Exercise (relevant fields)

| Field  | Type   | Notes          |
|--------|--------|----------------|
| `id`   | UUID   | Primary key    |
| `name` | String | Display name   |

### Routine (relevant fields)

| Field       | Type   | Notes                        |
|-------------|--------|------------------------------|
| `id`        | UUID   | Primary key                  |
| `patientId` | UUID   | For ownership validation     |
| `sessions`  | Relation | → `Session[]`              |

---

## New Response Shapes (shared-types additions)

### `SessionItemDetailResponse` (new — extends `SessionItemResponse`)

```typescript
// packages/shared-types/src/sessions.ts
export interface SessionItemDetailResponse extends SessionItemResponse {
  exerciseName: string;  // Joined from Exercise.name
}
```

### `SessionDetailResponse` (new)

```typescript
// packages/shared-types/src/sessions.ts
export interface SessionDetailResponse {
  id: string;
  routineId: string;
  date: string;                          // ISO 8601
  durationSeconds: number;
  score: number;                         // int, 0–100 (converted from 0–1 float)
  isSynced: boolean;
  createdAt: string;
  items: SessionItemDetailResponse[];
  navigation: {
    previousSessionId: string | null;    // chronologically older
    nextSessionId: string | null;        // chronologically newer
  };
}
```

### `RoutineHistoryItem` (new)

```typescript
// packages/shared-types/src/analytics.ts
export interface RoutineHistoryItem {
  id: string;
  date: string;                          // ISO 8601
  durationSeconds: number;
  score: number;                         // int, 0–100
  isSynced: boolean;
  items: Array<{
    exerciseId: string;
    averageAccuracy: number | null;
  }>;
}

// Updated (replaces old RoutineHistoryResponse)
export type RoutineHistoryResponse = RoutineHistoryItem[];
```

---

## UI Data Shape (web-only, not persisted)

### `SessionWithColor` (client-side)

```typescript
// apps/web/src/components/analytics/ (local type, not in shared-types)
interface SessionWithColor extends RoutineHistoryItem {
  color: string;      // Hex from SESSION_COLORS palette, assigned by index
  index: number;      // Position in history list (0 = most recent)
}
```

---

## Data Flow Diagram

```
PostgreSQL
  └── Session ──── SessionItem ──── Exercise (join for name)
        │
        ▼
   API Queries (Prisma)
        │
        ├── GET /api/v1/sessions/:id
        │     └── SessionDetailResponse (with items + exercise name + navigation)
        │
        └── GET /api/v1/routines/:id/history
              └── RoutineHistoryItem[] (with lightweight item summaries)

shared-types (packages/shared-types)
  └── SessionDetailResponse
  └── SessionItemDetailResponse
  └── RoutineHistoryItem
  └── RoutineHistoryResponse (updated)

Web Client
  └── RoutineAnalyticsPage
  │     ├── Assigns colors → SessionWithColor[]
  │     ├── InteractiveProgressChart (selected sessions → filtered dots)
  │     └── SessionHistoryTable (color badges + checkboxes → "View Details" link)
  │
  └── SessionDetailPage ([routineId]/sessions/[sessionId])
        ├── SessionMetadataCard
        ├── ExerciseBreakdownTable (items with accuracy + reps)
        └── SessionNavigator (prev/next buttons from navigation field)
```

---

## Ownership / Authorization Flow

```
GET /api/v1/sessions/:id
  1. Fetch Session by id (include routine → patient)
  2. If not found → 404
  3. If session.routine.patient.therapistId !== req.user.id → 403
  4. Return SessionDetailResponse
```

---

## State Management (web client)

The `RoutineAnalyticsPage` manages:

| State                  | Type                   | Source                         |
|------------------------|------------------------|--------------------------------|
| `history`              | `SessionWithColor[]`   | `getRoutineHistory()` + color mapping |
| `selectedSessionIds`   | `Set<string>`          | User toggle (default: all selected) |
| `stats`                | `RoutineStatsResponse` | `getRoutineStats()`            |

The `SessionDetailPage` fetches independently via:
- `getSessionDetail(token, sessionId)` → `SessionDetailResponse`
- `navigation.previousSessionId` / `navigation.nextSessionId` for prev/next buttons
