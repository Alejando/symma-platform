# Implementation Plan: Session Detail View & Interactive Analytics Chart

**Branch**: `003-session-analytics-view` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-session-analytics-view/spec.md`

## Summary

Add a Session Detail page reachable from the Routine Analytics session history table, showing a full exercise breakdown per session with previous/next navigation. Simultaneously make the Performance Trend chart interactive — each session receives a unique color, and therapists can toggle individual sessions to compare progress. Backend requires a new `GET /api/v1/sessions/:id` endpoint and an enriched history response. No database schema changes are needed.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode (API: NestJS 11+, Web: Next.js 16+ App Router)  
**Primary Dependencies**: Prisma (ORM), Recharts (charts), shadcn/ui + Radix UI + TailwindCSS v4 (web UI), class-validator + class-transformer (API DTOs), Vitest + Testing Library (web tests), Jest + Supertest (API tests)  
**Storage**: PostgreSQL 15 (port 5440, Dockerized) — read-only queries; no schema migrations needed  
**Testing**: API: Jest + co-located `.spec.ts`; Web: Vitest + co-located `.test.tsx`; E2E: Supertest in `apps/api/test/`  
**Target Platform**: Web (therapist dashboard) + API server (Linux Docker container)  
**Performance Goals**: Session detail API < 500ms p95; chart toggle update < 300ms (client-side state)  
**Constraints**: No video or CV data in session detail (constitution §I); no new DB migrations; max 20 sessions in history (existing `take: 20` limit); therapist JWT guard only (not patient guard)  
**Scale/Scope**: Single routine ≤ 20 sessions displayed; up to 20 exercise items per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Patient Privacy First** | ✅ PASS | No CV processing; no video. Session data (scores, reps) is aggregate metadata, not biometric raw data. Endpoint protected by therapist JWT. |
| **II. Offline-First Mobile** | ✅ PASS | This feature is web-only. Mobile sync flow (`SessionsController` POST) is unmodified. |
| **III. On-Device Computer Vision** | ✅ PASS | Not applicable — this feature reads stored session results, does not process CV. |
| **IV. Type Safety Across Boundaries** | ✅ PASS | New response shapes defined in `packages/shared-types` before implementation. Strict TS required. DTOs use class-validator. |
| **V. Test-Driven Quality** | ✅ PASS | Unit tests required for: new `SessionsService.findOne`, updated `AnalyticsController.getRoutineHistory`, new web components, and `session-colors.ts` utility. |
| **VI. Clinical Accuracy** | ✅ PASS | `averageAccuracy` displayed as-is (no rounding beyond 1 decimal); `null` shown as "N/A" not "0%". Score converted from 0–1 float to 0–100 int consistently. |
| **VII. Monorepo Cohesion** | ✅ PASS | pnpm, Turborepo, shared-types package. No new external dependencies (Recharts already present). |

**Post-design re-check**: All principles pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/003-session-analytics-view/
├── plan.md              ← This file
├── research.md          ← Phase 0: decisions on Recharts approach, color palette, URL pattern, auth
├── data-model.md        ← Phase 1: entity reference, new response shapes, state management
├── quickstart.md        ← Phase 1: dev setup, implementation order, verification checklist
├── contracts/
│   ├── get-session-detail.yaml             ← New endpoint contract
│   └── get-routine-history-enriched.yaml   ← Updated history endpoint contract
├── checklists/
│   └── requirements.md
└── tasks.md             ← Phase 2 output (via /speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/shared-types/src/
├── sessions.ts          ← ADD: SessionItemDetailResponse, SessionDetailResponse
└── analytics.ts         ← ADD: RoutineHistoryItem; UPDATE: RoutineHistoryResponse

apps/api/src/
├── sessions/
│   ├── sessions.controller.ts      ← ADD: GET :id handler (JwtAuthGuard)
│   ├── sessions.service.ts         ← ADD: findOne(id, therapistId) with ownership check
│   └── sessions.controller.spec.ts ← ADD: tests for findOne (200, 404, 403)
└── analytics/
    ├── analytics.controller.ts     ← UPDATE: getRoutineHistory includes item summaries
    └── analytics.controller.spec.ts ← UPDATE: cover items field in history response

apps/web/src/
├── lib/
│   ├── api.ts                      ← ADD: getSessionDetail(); UPDATE: getRoutineHistory types
│   └── session-colors.ts           ← NEW: SESSION_COLORS palette + getSessionColor(index)
├── components/analytics/
│   ├── ProgressChart.tsx           ← REFACTOR: ComposedChart with per-session dot colors + toggle
│   ├── ProgressChart.test.tsx      ← NEW: tests for interactive chart
│   └── session-colors.test.ts      ← NEW: color palette unit tests (co-located in lib/ or here)
└── app/dashboard/patients/[id]/routines/[routineId]/
    ├── page.tsx                    ← UPDATE: color mapping, selection state, updated table rows
    └── sessions/
        └── [sessionId]/
            ├── page.tsx            ← NEW: Session Detail page
            └── page.test.tsx       ← NEW: unit tests for session detail page
```

**Structure Decision**: Web application (monorepo). API changes in `apps/api/src/sessions/` and `apps/api/src/analytics/`. Web changes in `apps/web/src/`. Shared contracts in `packages/shared-types/src/`. Session detail route nested under `[routineId]/sessions/[sessionId]` to express ownership and share patient layout context.

## Complexity Tracking

> No constitution violations. Table not required.

## Implementation Phases

### Phase A — Foundation (unblocks all other work)

1. **shared-types** — Add new response interfaces. No runtime impact; pure type additions.
2. **API: Session Detail Endpoint** — New `GET /api/v1/sessions/:id` with `JwtAuthGuard`, ownership validation, and navigation hints. Includes unit tests.
3. **API: History Enrichment** — Update `getRoutineHistory` to include item summaries via Prisma `include`. Update existing spec.

### Phase B — Web: Interactive Chart (parallel with Phase C)

4. **`session-colors.ts`** — Color palette utility. Pure function, easily testable.
5. **`ProgressChart.tsx` refactor** — Migrate from `AreaChart` to `ComposedChart` (Area + Scatter). Accept `selectedIds` prop.
6. **`RoutineAnalyticsPage` update** — Color mapping, `selectedSessionIds` state, table row updates (color badge, checkbox, "View Details" link).

### Phase C — Web: Session Detail Page (parallel with Phase B)

7. **`getSessionDetail` API client function** — In `apps/web/src/lib/api.ts`.
8. **Session Detail page** — `[sessionId]/page.tsx` with `SessionMetadataCard`, `ExerciseBreakdownTable`, `SeriesDataChart`, `SessionNavigator`.

### Phase D — Tests & Verification

9. **All missing unit tests** — Per the test table in `quickstart.md`.
10. **Manual verification** — Per verification checklist in `quickstart.md`.
