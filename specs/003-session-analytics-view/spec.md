# Feature Specification: Session Detail View & Interactive Analytics Chart

**Feature Branch**: `003-session-analytics-view`  
**Created**: 2026-02-27  
**Status**: Draft  
**Input**: User description: "Vamos a crear la vista de las sesiones, dentro de la vista de la Routine Analytics, tenemos una tabla que muestra las sesiones de una rutina. Vamos a ver los datos que tenemos y como lo vamos a mostrar teniendo en cuenta los componentes que tenemos dentro del proyecto. Procura que una vez que este en la vista de la sesión sea facil moverte a las siguientes. Dentro de la vista de Routine Analytics, vamos a hacer más dinamica la grafica, para poder seleccionar alguno o más datos de las sesiones para poder ver los avances del paciente, agrega un color para sesión."

## Context

The Routine Analytics page (`/dashboard/patients/[id]/routines/[routineId]`) already exists and contains:
- Summary stats cards (total sessions, average accuracy, streak)
- A `ProgressChart` with a single area line showing the score over time
- A session history table showing: date, duration (minutes), score (%), and a placeholder "View Evidence" link

**Session data available per record** (from `Session` model):
- `id`, `date`, `durationSeconds`, `score` (float 0–1), `isSynced`

**Session Item data** (from `SessionItem` model, per exercise within a session):
- `exerciseId`, `repsCompleted`, `difficulty`, `averageAccuracy` (float 0–100), `seriesData` (JSON)

The current history endpoint (`GET /api/v1/routines/:id/history`) returns sessions **without** their items. A session detail endpoint does not yet exist.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Session Detail View (Priority: P1)

A therapist reviewing a patient's progress clicks on a session row in the Session History table and is taken to a dedicated Session Detail page. The page shows a breakdown of all exercises performed in that session — including reps completed, per-exercise accuracy score, difficulty level, and any per-rep series data available. The therapist can navigate to the previous or next session directly from this page without returning to the list.

**Why this priority**: Drilling into individual sessions is the core clinical action this feature unlocks. Without it, the therapist cannot verify whether a patient executed exercises correctly, only that a session occurred.

**Independent Test**: Can be fully tested by clicking any session row in the history table and verifying that the session breakdown loads with exercise-level data. Navigation arrows to adjacent sessions must work.

**Acceptance Scenarios**:

1. **Given** the Routine Analytics page with at least one session in the history table, **When** the therapist clicks a session row or its "View Details" action, **Then** the system navigates to the Session Detail page displaying date, total duration, overall score, and the list of exercises with their accuracy and reps.
2. **Given** the Session Detail page for session N, **When** the therapist clicks "Next Session", **Then** the system navigates to session N+1 (chronologically) without returning to the list.
3. **Given** the Session Detail page for session N, **When** the therapist clicks "Previous Session", **Then** the system navigates to session N-1.
4. **Given** the Session Detail page for the most recent session, **When** the therapist views the page, **Then** the "Next Session" navigation control is disabled or hidden.
5. **Given** the Session Detail page for the oldest session, **When** the therapist views the page, **Then** the "Previous Session" navigation control is disabled or hidden.
6. **Given** a session where some exercises have `seriesData`, **When** the therapist views those exercise rows, **Then** per-rep accuracy data is visible (e.g., as a small inline chart or expandable detail).

---

### User Story 2 - Interactive Multi-Session Chart Selection (Priority: P2)

A therapist on the Routine Analytics page wants to compare progress across specific sessions. The Performance Trend chart becomes interactive: each session in the history table has a unique color assigned, and the therapist can select or deselect one or more individual sessions to isolate their data points on the chart. Selecting sessions highlights the corresponding data points on the chart and dims others.

**Why this priority**: Enables clinical comparison — for example, seeing whether accuracy improved after a therapy adjustment on a specific date — without navigating away from the analytics view.

**Independent Test**: Can be fully tested by loading the Routine Analytics page with multiple sessions, toggling session checkboxes, and verifying the chart updates to highlight/show only selected sessions.

**Acceptance Scenarios**:

1. **Given** the Routine Analytics page with multiple sessions, **When** the page loads, **Then** each session row in the history table displays a distinct color indicator (dot or badge), and the corresponding data point on the chart uses that same color.
2. **Given** the history table with all sessions shown, **When** the therapist deselects a session, **Then** the chart hides or dims that session's data point.
3. **Given** some sessions selected and some deselected, **When** the therapist selects all sessions again, **Then** all data points appear on the chart.
4. **Given** a session row with its assigned color, **When** the therapist hovers over that session's chart data point, **Then** a tooltip shows the session date, duration, and score.
5. **Given** the history table, **When** more than 10 sessions exist, **Then** all sessions have unique, distinguishable colors with no two adjacent sessions sharing the same color.

---

### User Story 3 - API: Session Detail Endpoint (Priority: P1 — dependency)

The backend exposes a new endpoint to retrieve a single session by its ID including all its exercise items (exercise name, reps completed, difficulty, average accuracy, series data). The history endpoint is also updated to include session item summaries (per-exercise accuracy) for use in the chart's tooltip.

**Why this priority**: The Session Detail View (Story 1) cannot be built without per-session item data. This is a backend dependency that must be resolved first.

**Independent Test**: Can be fully tested by calling `GET /api/v1/sessions/:id` and verifying the response includes the session fields plus an `items` array with exercise details.

**Acceptance Scenarios**:

1. **Given** a valid session ID, **When** `GET /api/v1/sessions/:id` is called by an authenticated therapist, **Then** the response includes session fields (`id`, `date`, `durationSeconds`, `score`) plus an `items` array containing `exerciseId`, `exerciseName`, `repsCompleted`, `difficulty`, `averageAccuracy`, `seriesData`.
2. **Given** an invalid or non-existent session ID, **When** the endpoint is called, **Then** a 404 response is returned.
3. **Given** the session belongs to a routine not owned by the requesting therapist, **When** the endpoint is called, **Then** a 403 response is returned.

---

### Edge Cases

- What happens when a session has zero items (no exercises recorded)? The detail view shows a "No exercise data recorded" message.
- What happens when `averageAccuracy` is `null` for a session item? The accuracy field displays "N/A" rather than 0%.
- What happens when the history table has only one session? Both "Previous" and "Next" navigation buttons on the session detail are hidden.
- How does the chart handle sessions with the same date (duplicate same-day sessions)? Each session is plotted as a separate data point, distinguished by color.
- What happens if session detail data fails to load? The session detail page shows an error state with a "Retry" option.
- What happens when the color palette runs out of distinct colors for very large session counts? Colors cycle with a visual indicator (session number) to remain distinguishable.

---

## Requirements *(mandatory)*

### Functional Requirements

**Session Detail View (Web)**

- **FR-001**: The system MUST provide a dedicated Session Detail page accessible from the Session History table on the Routine Analytics page.
- **FR-002**: The Session Detail page MUST display session metadata: date, total duration (in minutes), overall score (as a percentage), and sync status.
- **FR-003**: The Session Detail page MUST display a breakdown list of all exercises performed, showing: exercise name, reps completed, difficulty level, and average accuracy percentage per exercise.
- **FR-004**: For exercises with available `seriesData`, the Session Detail page MUST display per-rep accuracy data in a visual format (chart or expandable row).
- **FR-005**: Users MUST be able to navigate to the chronologically next session from the Session Detail page without returning to the list.
- **FR-006**: Users MUST be able to navigate to the chronologically previous session from the Session Detail page without returning to the list.
- **FR-007**: Navigation controls to previous/next sessions MUST be disabled or hidden when no adjacent session exists in that direction.

**Interactive Analytics Chart (Web)**

- **FR-008**: The system MUST assign a unique, consistent color to each session displayed in the Session History table on the Routine Analytics page.
- **FR-009**: The Performance Trend chart MUST render each session's data point using its assigned color.
- **FR-010**: Users MUST be able to select or deselect individual sessions in the history table to control which data points are highlighted on the chart.
- **FR-011**: When a session is deselected, its corresponding data point on the chart MUST be visually dimmed or hidden.
- **FR-012**: When hovering over a chart data point, the tooltip MUST show: session date, duration, and score.
- **FR-013**: A "Select All" / "Deselect All" control MUST be available for the session selection.

**API (Backend)**

- **FR-014**: The system MUST expose a `GET /api/v1/sessions/:id` endpoint that returns full session detail including all session items with exercise names.
- **FR-015**: The session detail endpoint MUST be protected and only accessible to therapists who own the routine the session belongs to.
- **FR-016**: The history endpoint (`GET /api/v1/routines/:id/history`) MUST include per-session item summary data (list of `exerciseId` + `averageAccuracy`) to support chart tooltips.

### Key Entities

- **Session**: A single therapy execution. Key fields: `id`, `date`, `durationSeconds`, `score` (0–1 float), `isSynced`, `routineId`. Rendered as a color-coded row in the history table.
- **SessionItem**: One exercise within a session. Key fields: `exerciseId`, `repsCompleted`, `difficulty`, `averageAccuracy` (0–100 or null), `seriesData` (optional per-rep JSON). Displayed in the Session Detail breakdown.
- **Exercise**: Referenced by `SessionItem` via `exerciseId`. The `name` field is needed in the session detail view.
- **Session Color**: A UI-level property (not persisted) that maps a session's position/index in the history list to a distinct color from a predefined palette. Used consistently across the history table and the chart.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A therapist can reach the full exercise breakdown of any session within 2 clicks from the Routine Analytics page.
- **SC-002**: A therapist can navigate through all sessions of a routine sequentially (previous/next) without returning to the list.
- **SC-003**: The Performance Trend chart updates within 300ms of a session being selected or deselected in the history table.
- **SC-004**: Each session in the history table and chart uses a visually distinct color; no two adjacent sessions share the same color for up to 20 sessions.
- **SC-005**: The session detail endpoint returns a complete session record (with items) in under 500ms for routines with up to 100 sessions.
- **SC-006**: 100% of session items with non-null `averageAccuracy` display accurate percentage values (no rounding errors greater than 1%).

### Assumptions

- The exercise `name` field will be returned by joining the `Exercise` model in the session detail query.
- Session colors are assigned by index position in the history list (most recent = index 0) and are not stored in the database.
- The chart visualization library (Recharts) already in use supports per-point coloring and interactive toggling.
- The therapist JWT guard (not the patient JWT guard) protects the new session detail endpoint.
- The history endpoint will return at most 20 sessions (current `take: 20` limit) which is sufficient for the color palette.
