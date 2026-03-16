# Tasks: Session Detail View & Interactive Analytics Chart

**Input**: Design documents from `/specs/003-session-analytics-view/`  
**Branch**: `003-session-analytics-view`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.  
**Tests**: Included per constitution principle V (Test-Driven Quality — NON-NEGOTIABLE).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure environment is ready and shared-types package has the new contracts that all subsequent phases depend on. No runtime changes — pure type additions.

- [x] T001 Add `SessionItemDetailResponse` interface (extending `SessionItemResponse` with `exerciseName: string`) to `packages/shared-types/src/sessions.ts`
- [x] T002 Add `SessionDetailResponse` interface (with `id`, `routineId`, `date`, `durationSeconds`, `score`, `isSynced`, `createdAt`, `items: SessionItemDetailResponse[]`, `navigation: { previousSessionId: string | null; nextSessionId: string | null }`) to `packages/shared-types/src/sessions.ts`
- [x] T003 Add `RoutineHistoryItem` interface (with `id`, `date`, `durationSeconds`, `score`, `isSynced`, `items: Array<{ exerciseId: string; averageAccuracy: number | null }>`) to `packages/shared-types/src/analytics.ts`
- [x] T004 Replace `RoutineHistoryResponse = SessionResponse[]` with `RoutineHistoryResponse = RoutineHistoryItem[]` in `packages/shared-types/src/analytics.ts`
- [x] T005 Verify `packages/shared-types` builds cleanly with `pnpm --filter @symma/shared-types build` and all existing tests pass with `pnpm --filter @symma/shared-types test`

**Checkpoint**: shared-types updated — all downstream packages can now import the new types.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API backend changes that MUST be complete before the web UI can be built. Both US1 (session detail endpoint) and US3 (history enrichment) live here because they are parallel backend tasks and the web phases (US1 web, US2) depend on them.

**⚠️ CRITICAL**: No web user story work can begin until this phase is complete.

- [x] T006 [P] Add `findOne(sessionId: string, therapistId: string): Promise<SessionDetailResponse>` method to `apps/api/src/sessions/sessions.service.ts` — Prisma query: `session.findUnique({ where: { id }, include: { items: { include: { exercise: true } }, routine: { include: { patient: true } } } })`, validate `session.routine.patient.therapistId === therapistId` (throw `ForbiddenException` if mismatch), query sibling sessions ordered by `date ASC` to compute `previousSessionId` / `nextSessionId`, return `SessionDetailResponse` with score converted to `Math.round(score * 100)`
- [x] T007 [P] Add unit tests for `SessionsService.findOne` to `apps/api/src/sessions/sessions.service.spec.ts` — cover: returns `SessionDetailResponse` with items and navigation (200), throws `NotFoundException` for unknown id, throws `ForbiddenException` when therapist does not own the session, returns `previousSessionId: null` for oldest session, returns `nextSessionId: null` for newest session
- [x] T008 Add `GET :id` handler to `apps/api/src/sessions/sessions.controller.ts` — decorate with `@Get(':id')`, `@UseGuards(JwtAuthGuard)` (import from `apps/api/src/auth/jwt-auth.guard.ts`), `@ApiOperation`, `@ApiBearerAuth`; call `sessionsService.findOne(id, req.user.id)`; add `@Request() req` parameter; switch module-level guard from `jwt-patient` to per-endpoint guards (keep `@Post()` with `jwt-patient`, add `@Get(':id')` with `JwtAuthGuard`)
- [x] T009 Add unit tests for `GET :id` handler to `apps/api/src/sessions/sessions.controller.spec.ts` — cover: delegates to `sessionsService.findOne` with correct args (200), propagates `NotFoundException` (404), propagates `ForbiddenException` (403)
- [x] T010 [P] Update `AnalyticsController.getRoutineHistory` in `apps/api/src/analytics/analytics.controller.ts` — add `include: { items: { select: { exerciseId: true, averageAccuracy: true } } }` to the `session.findMany` query; map result to `RoutineHistoryItem[]` with `score: Math.round(s.score * 100)` and `items` array
- [x] T011 [P] Update `apps/api/src/analytics/analytics.controller.spec.ts` — add test coverage for the enriched `getRoutineHistory`: verifies each item in the response includes an `items` array with `exerciseId` and `averageAccuracy` fields
- [x] T012 Verify API compiles and all tests pass: `pnpm --filter api build && pnpm --filter api test`

**Checkpoint**: Foundation ready — `GET /api/v1/sessions/:id` and enriched history endpoint are functional. Web implementation can now begin.

---

## Phase 3: User Story 1 — Session Detail Page (Priority: P1) 🎯 MVP

**Goal**: Therapist can click any session row in the history table and see the full exercise breakdown (reps, accuracy, difficulty, seriesData). Can navigate prev/next without going back to the list.

**Independent Test**: Navigate to the Routine Analytics page, click "View Details" on any session row, verify the session detail page loads with exercise breakdown. Click prev/next arrows to confirm navigation works. Verify the oldest session has no "Previous" button and the newest has no "Next" button.

### Implementation for User Story 1

- [x] T013 [P] [US1] Add `getSessionDetail(token: string, sessionId: string): Promise<SessionDetailResponse>` function to `apps/web/src/lib/api.ts` — `fetchWithAuth(`${API_URL}/api/v1/sessions/${sessionId}`, token)` returning typed `SessionDetailResponse`
- [x] T014 [P] [US1] Create `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/sessions/[sessionId]/page.tsx` — `"use client"` page component; use `useParams()` for `sessionId`; use `useSession()` for auth token; fetch `getSessionDetail` on mount; render loading skeleton while fetching; render error state with retry button on failure
- [x] T015 [US1] Add `SessionMetadataCard` section inside `page.tsx` — display: date formatted with `format(parseISO(session.date), "PPP")`, duration as `Math.floor(durationSeconds / 60) min`, score as `${session.score}%` with a `Badge` (green if ≥70, amber if ≥50, red otherwise), sync status as a `Badge variant="outline"`
- [x] T016 [US1] Add `ExerciseBreakdownTable` section inside `page.tsx` — shadcn `Table` with columns: Exercise Name, Reps Completed, Difficulty, Accuracy; render `averageAccuracy` as `${value.toFixed(1)}%` when not null, `"N/A"` when null; render "No exercise data recorded" empty state when `items.length === 0`
- [x] T017 [US1] Add `SeriesDataChart` collapsible section inside `page.tsx` — for each item where `seriesData?.reps` is a non-empty array, render a Recharts `BarChart` (height 80px) showing per-rep values; wrap in a `<details>` / `<summary>` or shadcn `Collapsible`; skip section entirely when `seriesData` is null
- [x] T018 [US1] Add `SessionNavigator` section inside `page.tsx` — two `Button` components using Lucide `ChevronLeft` / `ChevronRight` icons; "Previous Session" navigates to `../${previousSessionId}` using `useRouter().push`; "Next Session" navigates to `../${nextSessionId}`; disable (or hide) each button when the corresponding ID is `null`; add a "Back to Analytics" link using `Link` pointing to the parent `[routineId]` page
- [x] T019 [US1] Update "View Evidence" cell in the session history table inside `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/page.tsx` — replace static text with a `Link` (shadcn `Button variant="ghost" size="sm"`) pointing to `sessions/${session.id}` relative to the current route
- [x] T020 [US1] Write unit tests for the Session Detail page in `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/sessions/[sessionId]/page.test.tsx` — cover: renders loading state initially, renders exercise table after data loads (mock `getSessionDetail`), shows "N/A" when `averageAccuracy` is null, "Previous" button is disabled when `previousSessionId` is null, "Next" button is disabled when `nextSessionId` is null, shows "No exercise data recorded" when items array is empty

**Checkpoint**: User Story 1 complete — therapists can reach and navigate session detail without returning to the list.

---

## Phase 4: User Story 2 — Interactive Multi-Session Chart (Priority: P2)

**Goal**: Each session in the history table has a unique color. Therapists can toggle sessions on/off to isolate data points on the Performance Trend chart. Chart dots are per-session colored and tooltips show date, duration, and score.

**Independent Test**: Load the Routine Analytics page with multiple sessions. Verify each row has a colored dot badge. Deselect one session checkbox — verify its chart dot disappears/dims. Re-select — verify it returns. Hover a chart dot — verify tooltip shows date, duration, score.

### Implementation for User Story 2

- [x] T021 [P] [US2] Create `apps/web/src/lib/session-colors.ts` — export `SESSION_COLORS: string[]` constant (20 hex values from research.md RES-002); export `getSessionColor(index: number): string` function that returns `SESSION_COLORS[index % SESSION_COLORS.length]`
- [x] T022 [P] [US2] Write unit tests for the color utility in `apps/web/src/lib/session-colors.test.ts` — cover: `getSessionColor(0)` returns first color, `getSessionColor(20)` wraps back to index 0 (cycles), all 20 palette entries are defined and valid hex strings, no two adjacent palette entries are identical
- [x] T023 [US2] Refactor `apps/web/src/components/analytics/ProgressChart.tsx` — change props to accept `sessions: Array<{ id: string; date: string; score: number; durationSeconds: number; color: string }>` and `selectedIds: Set<string>`; migrate from `AreaChart` to `ComposedChart` (import `ComposedChart`, `Area`, `Scatter`, `ZAxis` from recharts); render `Area` for the trend line using all session data; render `Scatter` layer using only selected sessions' data mapped to `{ x: date, y: score, id, color, durationSeconds }`; implement custom `shape` prop on `Scatter` to render each dot using its `color` field; update `Tooltip` `labelFormatter` to include duration alongside date and score
- [x] T024 [US2] Write unit tests for the refactored `ProgressChart` in `apps/web/src/components/analytics/ProgressChart.test.tsx` — cover: renders without error with empty data, renders colored dots for selected sessions, deselected session does not appear in Scatter data, tooltip content includes duration
- [x] T025 [US2] Update `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/page.tsx` — add `SessionWithColor` local type extending `RoutineHistoryItem` with `color: string` and `index: number`; after fetching history, map `RoutineHistoryItem[]` to `SessionWithColor[]` assigning `getSessionColor(index)` per entry; add `selectedSessionIds` state as `Set<string>` initialized with all session IDs; update `ProgressChart` call to pass `sessions={sessionsWithColor}` and `selectedIds={selectedSessionIds}`
- [x] T026 [US2] Add session selection controls to the history table in `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/page.tsx` — add a "Select All" / "Deselect All" toggle button in the `CardHeader` of the Session History card; add a color dot (`<span>` with `backgroundColor: session.color`, 10px circle) as first column in each `TableRow`; add a `Checkbox` (shadcn) as second column that toggles `session.id` in/out of `selectedSessionIds`; update the existing table columns to accommodate the two new leading columns

**Checkpoint**: User Story 2 complete — chart is interactive; color coding is consistent between table and chart.

---

## Phase 5: User Story 3 — API Session Detail Endpoint (Priority: P1 — dependency)

> **Note**: This user story was the backend prerequisite delivered in Phase 2 (T006–T011) since the web phases depended on it. This phase validates the full integration and adds the E2E test.

**Goal**: `GET /api/v1/sessions/:id` returns full session detail with items, exercise names, and navigation hints. Protected by therapist JWT. History endpoint now returns item summaries.

**Independent Test**: Call `GET /api/v1/sessions/:id` with a valid therapist JWT and a valid session ID. Verify response contains `items` array with `exerciseName`, `repsCompleted`, `difficulty`, `averageAccuracy`, `seriesData`, and `navigation.previousSessionId` / `navigation.nextSessionId`. Call with invalid ID → 404. Call with session from another therapist's patient → 403.

### Implementation for User Story 3

- [x] T027 [US3] Create E2E test file `apps/api/test/sessions.e2e-spec.ts` — using Supertest; cover: `GET /api/v1/sessions/:id` with valid therapist JWT returns 200 with correct shape; missing auth returns 401; non-existent session ID returns 404; session belonging to another therapist's patient returns 403; history endpoint `GET /api/v1/routines/:id/history` returns array where each item has an `items` field with `exerciseId` and `averageAccuracy`
- [x] T028 [US3] Verify `SessionsModule` registers the `JwtAuthGuard` provider and imports `AuthModule` (or `PassportModule`) as needed in `apps/api/src/sessions/sessions.module.ts` — add missing imports if the guard cannot be resolved at runtime
- [x] T029 [US3] Add Swagger annotations to the new `GET :id` handler in `apps/api/src/sessions/sessions.controller.ts` — `@ApiOperation({ summary: 'Get session detail for therapist review' })`, `@ApiParam({ name: 'id', type: String })`, `@ApiResponse({ status: 200, description: 'Session with items and navigation' })`, `@ApiResponse({ status: 403, description: 'Forbidden' })`, `@ApiResponse({ status: 404, description: 'Not found' })`

**Checkpoint**: User Story 3 complete — endpoint is tested end-to-end and documented in Swagger.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration checks, type safety validation, and UX polish across all three stories.

- [x] T030 [P] Update `apps/web/src/lib/api.ts` — change return type annotation of `getRoutineHistory` from `any[]` to `RoutineHistoryItem[]` (import from `@symma/shared-types`); add return type annotation `Promise<SessionDetailResponse>` to `getSessionDetail`; verify no implicit `any` remains in the file
- [x] T031 [P] Verify the existing `RoutineStatsCards` and `ProgressChart` integration in `apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/page.tsx` still renders correctly after the page refactor — check that `stats.chartData` is still passed to the `ComposedChart`'s `Area` and the component renders the trend line for all sessions regardless of `selectedSessionIds`
- [x] T032 [P] Add loading skeleton for the Session Detail page that matches the layout — three `Skeleton` blocks: one for metadata card (h-24), one for the exercise table (h-48), one for the navigator (h-12); visible while `loading === true`
- [x] T033 [P] Verify breadcrumb / back navigation from the Session Detail page is consistent with the existing dashboard layout — "Back to Analytics" link must render inside the existing patient layout (sidebar present); test by checking the route renders under `patients/[id]/layout.tsx`
- [ ] T034 Run full monorepo validation: `pnpm build && pnpm lint && pnpm test && pnpm check-types` — fix any compilation, lint, or type errors _(blocked by pre-existing API lint debt outside this feature: `apps/api/src/auth/auth.service.spec.ts`, `apps/api/src/patients/patients.service.spec.ts`, `apps/api/src/routines/**`, `apps/api/src/routines/dto/create-routine.dto.ts`, `apps/api/src/routines/routines.controller.ts`)_
- [x] T035 Perform manual verification against the checklist in `specs/003-session-analytics-view/quickstart.md` — confirmed via implemented UI + focused tests (`ProgressChart.test.tsx`, session detail `page.test.tsx`) and route/component inspection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion (needs new shared-types) — **BLOCKS** all web phases
- **Phase 3 (US1 — Session Detail Page)**: Depends on Phase 2 (`GET /api/v1/sessions/:id` must exist)
- **Phase 4 (US2 — Interactive Chart)**: Depends on Phase 2 (enriched history must exist); **can run in parallel with Phase 3**
- **Phase 5 (US3 — E2E + Swagger)**: Depends on Phase 2 (validates what was built there); can run in parallel with Phases 3 & 4
- **Phase 6 (Polish)**: Depends on Phases 3, 4, and 5 all complete

### User Story Dependencies

- **US3 (API)**: Foundational — implemented in Phase 2. No dependency on US1 or US2.
- **US1 (Session Detail Page)**: Depends on US3 API. No dependency on US2.
- **US2 (Interactive Chart)**: Depends on US3 (enriched history). No dependency on US1.

### Within Each Phase

- Tasks marked `[P]` within the same phase can run in parallel (operate on different files)
- Tests (`T007`, `T009`, `T011`) should be written before or alongside their implementation tasks
- `T006` and `T010` are independent and can run in parallel (different files in different modules)

---

## Parallel Execution Examples

### Phase 2 — Two parallel tracks

```
Track A (Sessions module):          Track B (Analytics module):
T006 — SessionsService.findOne      T010 — AnalyticsController history enrichment
T007 — Service unit tests           T011 — Analytics controller spec update
T008 — Controller GET :id handler
T009 — Controller unit tests
       ↓ both tracks merge →
T012 — Full API build + test
```

### Phase 3 + Phase 4 — Parallel after Phase 2

```
Phase 3 track (US1):                Phase 4 track (US2):
T013 — getSessionDetail in api.ts   T021 — session-colors.ts utility
T014 — Session Detail page.tsx      T022 — session-colors unit tests
T015 — SessionMetadataCard          T023 — ProgressChart refactor
T016 — ExerciseBreakdownTable       T024 — ProgressChart unit tests
T017 — SeriesDataChart              T025 — RoutineAnalyticsPage: color mapping + state
T018 — SessionNavigator             T026 — RoutineAnalyticsPage: table selection UI
T019 — Update "View Details" link
T020 — Page unit tests
```

---

## Implementation Strategy

### MVP First (User Story 1 — Session Detail Page)

1. Complete **Phase 1** (shared-types) — ~30 min
2. Complete **Phase 2, Track A** (T006–T009, T012) — session detail API only
3. Complete **Phase 3** (T013–T020) — full session detail web page
4. **STOP and VALIDATE**: Click any session row → detail page loads with exercise data; prev/next navigation works
5. Demo to user — clinical value delivered without the interactive chart

### Full Delivery

1. Phase 1 → Phase 2 (both tracks) → Phases 3 + 4 + 5 in parallel → Phase 6
2. Each phase adds value without breaking previous work

### Single Developer Sequence

```
T001 → T002 → T003 → T004 → T005 →     (Phase 1)
T006 → T007 → T008 → T009 →
T010 → T011 → T012 →                    (Phase 2)
T013 → T014 → T015 → T016 → T017 → T018 → T019 → T020 →   (Phase 3)
T021 → T022 → T023 → T024 → T025 → T026 →                  (Phase 4)
T027 → T028 → T029 →                    (Phase 5)
T030 → T031 → T032 → T033 → T034 → T035  (Phase 6)
```

---

## Notes

- `[P]` tasks operate on different files — safe to parallelize
- `[Story]` label maps each task to its user story for traceability
- Constitution principle V mandates tests for every new service method, controller handler, and utility function
- `averageAccuracy` values must NEVER be displayed as `0%` when the DB value is `null` — always show `"N/A"`
- Score conversion: DB stores `score` as float 0–1; all display and API responses use integer 0–100 (`Math.round(score * 100)`)
- The `jwt-patient` guard on `SessionsController.create` (POST) must remain unchanged — only the new GET handler uses `JwtAuthGuard`
- Commit after each checkpoint to enable clean rollback if needed
