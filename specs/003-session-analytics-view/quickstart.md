# Quickstart: Session Detail View & Interactive Analytics Chart

**Feature**: 003-session-analytics-view  
**Branch**: `003-session-analytics-view`

---

## Prerequisites

```bash
make db-up        # PostgreSQL on port 5440
make db-migrate   # Apply any pending migrations
make db-generate  # Regenerate Prisma client
make install      # pnpm install across monorepo
```

## Development

```bash
make dev          # Starts API (port 4001) + Web (port 4000) concurrently
```

## Run Tests

```bash
# All tests
make test

# API tests only (Jest)
pnpm --filter api test

# Web tests only (Vitest)
pnpm --filter web test

# Specific test file
pnpm --filter api test -- --testPathPattern=analytics
```

---

## Feature Implementation Order

### Step 1 — shared-types (no DB changes)

Update `packages/shared-types/src/sessions.ts`:
- Add `SessionItemDetailResponse` (extends `SessionItemResponse` + `exerciseName`)
- Add `SessionDetailResponse` (with `items` + `navigation`)

Update `packages/shared-types/src/analytics.ts`:
- Add `RoutineHistoryItem` (lightweight session + item summaries)
- Replace `RoutineHistoryResponse = SessionResponse[]` with `RoutineHistoryResponse = RoutineHistoryItem[]`

```bash
# Verify types build cleanly
pnpm --filter @symma/shared-types build
```

### Step 2 — API: Session Detail Endpoint

Add `GET /api/v1/sessions/:id` to the **existing `SessionsController`**:

```
apps/api/src/sessions/
  sessions.controller.ts   ← Add GET :id handler
  sessions.service.ts      ← Add findOne(id, therapistId) method
  sessions.controller.spec.ts  ← Add unit tests
```

The `findOne` method:
1. Fetches `session` by ID with `include: { items: { include: { exercise: true } }, routine: { include: { patient: true } } }`
2. Validates `session.routine.patient.therapistId === therapistId` → 403 if mismatch
3. Queries sibling sessions (`WHERE routineId = session.routineId ORDER BY date ASC`) to compute `previousSessionId` / `nextSessionId`
4. Returns `SessionDetailResponse`

Guard: `JwtAuthGuard` (therapist JWT, **not** `jwt-patient`).

### Step 3 — API: Enrich History Endpoint

Update `AnalyticsController.getRoutineHistory` in `apps/api/src/analytics/analytics.controller.ts`:
- Add `include: { items: { select: { exerciseId: true, averageAccuracy: true } } }` to the `findMany` query
- Map result to `RoutineHistoryItem[]`
- Update `analytics.controller.spec.ts` to cover the new items field

### Step 4 — Web: Update shared-types usage

Update `apps/web/src/lib/api.ts`:
- Change `getRoutineHistory` return type to `RoutineHistoryItem[]`
- Add `getSessionDetail(token, sessionId): Promise<SessionDetailResponse>`

### Step 5 — Web: Color palette utility

Create `apps/web/src/lib/session-colors.ts`:
- `SESSION_COLORS: string[]` — 20-color palette constant
- `getSessionColor(index: number): string` — index % palette length

### Step 6 — Web: Interactive Analytics Chart

Refactor `apps/web/src/components/analytics/ProgressChart.tsx`:
- Accept `sessions: SessionWithColor[]` + `selectedIds: Set<string>` props
- Use `ComposedChart` with `Area` (trend) + `Scatter` (individual session dots)
- Render each dot with its assigned `color`; dim/hide deselected dots

Update `RoutineAnalyticsPage` (`apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/page.tsx`):
- Map `RoutineHistoryItem[]` → `SessionWithColor[]` (assign colors by index)
- Add `selectedSessionIds: Set<string>` state (default: all selected)
- Add "Select All / Deselect All" control
- Pass `selectedIds` to `ProgressChart`
- Add checkbox + color badge to each `SessionHistoryTable` row
- Replace "View Evidence" with "View Details" → links to `/sessions/[id]`

### Step 7 — Web: Session Detail Page

Create new page:
```
apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/sessions/[sessionId]/page.tsx
```

Components (co-located in `_components/` subfolder or in `src/components/analytics/`):
- `SessionMetadataCard` — date, duration, score badge, sync status
- `ExerciseBreakdownTable` — table of items: name, reps, difficulty, accuracy (N/A if null)
- `SeriesDataChart` — mini BarChart for per-rep accuracy (shown only if seriesData present)
- `SessionNavigator` — prev/next buttons (disabled when null)

### Step 8 — Tests

| File | Tests to add |
|------|-------------|
| `apps/api/src/sessions/sessions.controller.spec.ts` | `getSessionDetail`: 200, 404, 403 |
| `apps/api/src/analytics/analytics.controller.spec.ts` | `getRoutineHistory` items field |
| `apps/web/src/lib/session-colors.test.ts` | Color palette assignment, cycling |
| `apps/web/src/components/analytics/ProgressChart.test.tsx` | Renders dots, responds to selection |
| `apps/web/src/app/dashboard/.../sessions/[sessionId]/page.test.tsx` | Renders items, nav buttons disabled/enabled |

---

## Key Files Reference

| File | Change Type |
|------|-------------|
| `packages/shared-types/src/sessions.ts` | Add new response types |
| `packages/shared-types/src/analytics.ts` | Add `RoutineHistoryItem`, update `RoutineHistoryResponse` |
| `apps/api/src/sessions/sessions.controller.ts` | Add `GET :id` with `JwtAuthGuard` |
| `apps/api/src/sessions/sessions.service.ts` | Add `findOne` with ownership check + navigation |
| `apps/api/src/analytics/analytics.controller.ts` | Enrich history with item summaries |
| `apps/web/src/lib/api.ts` | Add `getSessionDetail`, update `getRoutineHistory` types |
| `apps/web/src/lib/session-colors.ts` | New — color palette utility |
| `apps/web/src/components/analytics/ProgressChart.tsx` | Refactor to interactive ComposedChart |
| `apps/web/src/app/.../[routineId]/page.tsx` | Add session colors, selection state, updated table |
| `apps/web/src/app/.../sessions/[sessionId]/page.tsx` | New — session detail page |

---

## Verification Checklist

```bash
pnpm build          # No TypeScript errors across all packages
pnpm lint           # No linting violations
pnpm test           # All unit tests pass (including new specs)
pnpm check-types    # Strict TS mode clean
```

Manual verification:
1. Open Routine Analytics page → history table shows color badges + "View Details" links
2. Toggle session checkboxes → chart dots appear/disappear
3. Click "View Details" → session detail page loads with exercise breakdown
4. "Previous" / "Next" buttons navigate between sessions
5. Exercise row with `seriesData` shows mini chart; row without shows "N/A"
6. "Previous" button hidden/disabled on oldest session; "Next" hidden on most recent
