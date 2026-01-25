# RFC-006: Routine Analytics & Progress Visualization (No-Mockup)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-005 (Navigation), RFC-004 (Data Models) |
| **Scope** | Backend (Stats Logic + Seeding), Web (Data Viz) |
| **URL Pattern** | `/dashboard/patients/[id]/routines/[routineId]` |
| **Design System** | Shadcn UI + Recharts (Teal Theme) |

## 1. Objective
Implement the "Single Routine Detail View".
This view serves two purposes:
1.  **Clinical Review:** Show the Therapist exactly how the patient is performing (Charts).
2.  **Audit:** Review the configuration of the routine (Exercises assigned) and the raw history.

**Challenge:** No mobile data exists yet.
**Solution:** We rely heavily on **Mock Seeding** to visualize the dashboard.

## 2. Technical Specifications

### 2.1 Database & Seeding (The Foundation)
* **File:** `packages/database/prisma/seed.ts`.
* **Requirement:** Create a robust seeding function `seedPatientSessions(patientId, routineId)` that:
    * Generates **14 Sessions** (past 2 weeks).
    * **Simulate Improvement:**
        * Day 1-5: Scores randomly between `0.3` and `0.5`.
        * Day 6-10: Scores between `0.5` and `0.7`.
        * Day 11-14: Scores between `0.7` and `0.9`.
    * Ensures `is_synced = true`.

### 2.2 Backend API (NestJS)
* **Module:** `AnalyticsModule` (or extend `SessionsModule`).
* **Endpoints:**
    * `GET /routines/:id/stats`:
        * **Response:** `{ summary: { totalSessions: number, currentStreak: number, avgScore: number }, chartData: { date: string, score: number }[] }`.
        * **Logic:** Aggregation must happen in the DB (Postgres `AVG` or Prisma `groupBy`), do NOT fetch all rows to calculate in JS if possible.
    * `GET /routines/:id/history`:
        * **Response:** Paginated list of sessions.

### 2.3 Web Frontend (Next.js) - Detailed Layout Layout
Since there is no Mockup, strictly follow this **Grid Layout Strategy**:

* **Header Section:**
    * Title: Routine Name.
    * Subtitle: Date Range (e.g., "Jan 01 - Jan 30").
    * Right Action: Badge (Active/Completed).

* **Row 1: KPI Cards (Grid: 3 Columns)**
    * Card A: **"Total Sessions"** (Icon: `Activity`).
    * Card B: **"Average Accuracy"** (Icon: `Percent`).
    * Card C: **"Current Streak"** (Icon: `Flame`).

* **Row 2: Main Content (Grid: 2 Columns, Split 2/3 - 1/3)**
    * **Left Column (The Chart):**
        * Component: `<Card>` containing `<ResponsiveContainer>` -> `<AreaChart>`.
        * **Style:** Use `stroke="#0D9488"` (Teal-600) and `fill="#0D9488"` with opacity.
        * X-Axis: Date (formatted "DD/MM"). Y-Axis: Score (0-100%).
    * **Right Column (The Config):**
        * Component: `<Card>` title "Prescribed Exercises".
        * Content: A scrollable list of small items (Avatar of exercise + Name + "10 reps"). **Read-only**.

* **Row 3: History (Full Width)**
    * Component: `<Table>`.
    * Columns: Date, Duration, Score, View Evidence (Link).

### 2.4 Responsiveness Rules
* **Desktop:** As described above (Grid columns).
* **Mobile (<768px):**
    * KPI Cards: Stack 1 per row (or scrollable carousel).
    * Chart & Config: Stack vertically (Chart on top).
    * Table: Hide less important columns (e.g., Duration) or enable horizontal scroll.

---

## 3. Implementation Steps (Agent Instructions)

1.  **Phase 1: Data (Backend)**
    * Write the seed script first.
    * Run `pnpm db:seed`.
    * Verify data exists in DB (using Prisma Studio or SQL).
    * Implement the API endpoints and test with `curl`.

2.  **Phase 2: UI Construction (Frontend)**
    * Install: `pnpm add recharts lucide-react date-fns`.
    * Build the components in isolation first (`<RoutineStatsCards />`, `<ProgressChart />`).
    * Assemble the page layout following the Grid Strategy.

3.  **Phase 3: Integration**
    * Fetch data from API.
    * Handle "Loading" state (Skeleton cards).
    * Handle "Empty" state (If seed fails or new routine, show "No data available").

---

## 4. Acceptance Criteria

* **[ ] Visual:** Chart uses Brand Color (Teal).
* **[ ] Data:** The chart shows an upward trend (validating the seed logic).
* **[ ] Layout:** On Desktop, the Config list is to the right of the Chart. On Mobile, it is below.
* **[ ] Robustness:** If a routine has exercises but 0 sessions, the page does not crash (Shows empty chart).