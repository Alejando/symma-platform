# Research: Session Detail View & Interactive Analytics Chart

**Feature**: 003-session-analytics-view  
**Phase**: 0 — Unknowns resolved before design

---

## RES-001: Recharts per-point coloring and interactive toggling

**Question**: Does the existing Recharts library (already in use for `ProgressChart`) support rendering individual data points with distinct colors and allowing interactive show/hide of specific points?

**Decision**: Use Recharts `ScatterChart` (or `LineChart` with custom `Dot` renderer) for the interactive multi-session chart. Individual dot colors are achievable via a custom `dot` prop that maps each point to a palette color by index. For toggling visibility, maintain a `Set<string>` of selected session IDs in component state and filter/opacity-control rendered points accordingly.

**Rationale**: Recharts is already a project dependency (`ProgressChart` uses `AreaChart`). Switching libraries would violate the VII Monorepo Cohesion principle. Recharts supports custom dot rendering and conditional rendering of data series. The `ScatterChart` approach plots each session as an independent dot; a `LineChart` with `connectNulls={false}` and null substitution for deselected points also works for trend visualization.

**Alternatives considered**:
- Replace Recharts with Chart.js: rejected — introduces a new dependency, higher bundle size, and violates monorepo cohesion.
- D3 custom rendering: rejected — high complexity for marginal gain; Recharts already wraps D3.
- Visx (Airbnb): rejected — heavier abstraction, not established in project.

**Implementation approach**: Retain `AreaChart` for the overall trend line (current behavior), but add a `ScatterChart` overlay — or migrate to a `ComposedChart` with `Area` + `Scatter` layers so the trend line and individual colored dots coexist in a single chart.

---

## RES-002: Session color palette strategy

**Question**: What color palette should be used to assign distinct, accessible colors to up to 20 sessions? Should colors be derived from the design system or be hardcoded?

**Decision**: Define a `SESSION_COLORS` constant (20 distinct hex values) in a shared utility, derived from the design system palette (Teal, Slate, Rose, Indigo, Amber, Violet, Cyan, Emerald, Orange, Pink, etc.). Colors are assigned by array index modulo palette length.

**Rationale**: The constitution specifies Teal 600 (`#0D9488`) as primary and Rose 600 (`#E11D48`) for alerts. The full Tailwind v4 palette provides semantically consistent colors. Using index-based assignment (not ID-based hashing) ensures stable color ordering that matches the visual table-to-chart correspondence therapists expect.

**Color palette** (20 colors, WCAG AA contrast on white/dark backgrounds):
```
#0D9488 (teal-600), #6366F1 (indigo-500), #F59E0B (amber-500), #8B5CF6 (violet-500),
#06B6D4 (cyan-500), #10B981 (emerald-500), #F97316 (orange-500), #EC4899 (pink-500),
#3B82F6 (blue-500), #EF4444 (red-500), #84CC16 (lime-500), #14B8A6 (teal-500),
#A855F7 (purple-500), #F43F5E (rose-500), #22C55E (green-500), #EAB308 (yellow-500),
#64748B (slate-500), #0EA5E9 (sky-500), #D946EF (fuchsia-500), #78716C (stone-500)
```

---

## RES-003: Session Detail page URL pattern

**Question**: Where should the session detail page live in the Next.js App Router file system? Should it be a nested route under `[routineId]` or a standalone route?

**Decision**: Nested route under `[routineId]`:
```
apps/web/src/app/dashboard/patients/[id]/routines/[routineId]/sessions/[sessionId]/page.tsx
```

**Rationale**: Sessions belong to a routine. Nesting the route under `[routineId]` naturally expresses ownership, enables breadcrumb generation from URL params, and allows the layout to carry the patient context (the existing `layout.tsx` at `patients/[id]/layout.tsx` provides the sidebar/patient context). Previous/Next navigation passes `sessionId` params from a preloaded list; the history list is passed as a URL param or fetched from context.

**Navigation between sessions**: The session detail page receives `previousSessionId` and `nextSessionId` as part of the API response or preloaded from the history list. To avoid an extra API call on the detail page, the history endpoint will include session ordering, and the web client will compute prev/next from the history list and encode them as query params or pass via URL. Given App Router conventions, `previousSessionId` and `nextSessionId` are best passed as `searchParams` alongside the `sessionId` path segment.

---

## RES-004: API authorization — therapist guard for session detail

**Question**: The existing `SessionsController` uses `jwt-patient` guard (mobile only). The new session detail endpoint must be accessible only to therapists. Which guard applies?

**Decision**: Use `JwtAuthGuard` (the `jwt` strategy guard at `apps/api/src/auth/jwt-auth.guard.ts`) for the new `GET /api/v1/sessions/:id` endpoint. Add ownership validation by traversing `session → routine → patient → therapist` and comparing `therapist.id` to `req.user.id`.

**Rationale**: The `jwt` strategy already handles therapist authentication. The `jwt-patient` guard is only for the mobile app patient authentication flow. All existing web-facing endpoints (`AnalyticsController`, `PatientsController`, `RoutinesController`) use `JwtAuthGuard`.

---

## RES-005: History endpoint enrichment — backward compatibility

**Question**: Updating `GET /api/v1/routines/:id/history` to include session items will increase payload size. Is this backward compatible? Does the mobile app consume this endpoint?

**Decision**: The history endpoint is consumed only by the web app (`apps/web/src/lib/api.ts → getRoutineHistory`). The mobile app uses the `GET /api/v1/mobile/active-routine` endpoint, not the history endpoint. Adding `items` as an optional field is fully backward compatible.

**Rationale**: Confirmed by reviewing `apps/api/src/mobile/mobile.controller.ts` (separate endpoint) and `apps/web/src/lib/api.ts` (only consumer of `/history`). The `SessionResponse` type in `shared-types` already has `items?: SessionItemResponse[]` as optional, so adding it to the history response requires no type breaking changes.

---

## RES-006: `seriesData` display format in session detail

**Question**: `seriesData` is an opaque JSON blob per exercise rep series. How should it be displayed?

**Decision**: Render `seriesData` as a collapsible/expandable row using an inline mini `BarChart` (Recharts) showing per-rep accuracy scores. If `seriesData` is `null` or has no parseable accuracy values, collapse the section and show only the aggregate `averageAccuracy`. The `seriesData` structure (from `SessionItemDto`) contains `{ reps: number[] }` based on the spec tests.

**Rationale**: Keeps the detail view clean by default (collapsed) while giving therapists access to granular per-rep data when needed. Using a mini BarChart matches the existing Recharts usage and requires no new library.

---

## RES-007: shared-types additions required

**Question**: Do the existing `shared-types` interfaces cover the new API responses?

**Decision**: The following additions are needed in `packages/shared-types/src/sessions.ts`:
- `SessionItemDetailResponse` — extends `SessionItemResponse` with `exerciseName: string`
- `SessionDetailResponse` — includes `items: SessionItemDetailResponse[]` and navigation hints

And in `packages/shared-types/src/analytics.ts`:
- `RoutineHistoryItem` — `SessionResponse` enriched with `items: Array<{ exerciseId: string; averageAccuracy: number | null }>`
- `RoutineHistoryResponse` updated to `RoutineHistoryItem[]`

**Rationale**: Constitution principle IV (Type Safety Across Boundaries) mandates that all API contracts flow through `packages/shared-types`. New response shapes MUST be typed here before being used in `apps/api` or `apps/web`.
