# RFC-007: Exercise Catalog Management & Schema Update

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-004 (Routines) |
| **Scope** | Database (Schema Change), Backend (CRUD), Web (UI) |
| **Design Style** | Follow existing Shadcn Dashboard patterns (Tables/Sheets). No specific mockup provided. |

## 1. Objective
Currently, Exercises are static and inserted via code (Seeds). We need a **Management Interface** so Admins/Therapists can create, edit, and delete exercises dynamically.

**Critical Schema Patch:** We identified a missing logic in our data model: **"Rest Time Between Sets"**. This field is clinically necessary for the mobile app to handle pauses during therapy.

## 2. Technical Specifications

### 2.1 Database Schema Update (Prisma)
* **File:** `packages/database/schema.prisma`.
* **Change 1 (The Fix):** Add `rest_between_sets_seconds` (Int, default 60) to the **`RoutineItem`** model.
* **Change 2 (Defaults):** Ensure the **`Exercise`** model's `default_config` JSON structure includes a default value for `rest_seconds`.
* **Action:** Run `pnpm db:push` or migration to apply changes.

### 2.2 Backend API (NestJS)
* **Module:** `ExercisesModule` (Update).
* **Endpoints:**
    * `GET /exercises`: (Already exists, ensure it returns full details).
    * `POST /exercises`: Create new exercise.
        * Body: `{ name, type, category, video_url, animation_url, defaultConfig: { targetReps, targetSets, holdTime, restTime } }`.
    * `PUT /exercises/:id`: Update details.
    * `DELETE /exercises/:id`: **Constraint:** Prevent delete (or use Soft Delete) if the exercise is used in active routines.

### 2.3 Web Frontend - Management (Next.js)
* **Route:** `/dashboard/exercises`.
* **Layout:** Standard Dashboard Page (Header + Table).
* **UI Components:**
    * **List View:** Table showing Name, Category (Badge), Type, and specific "Default Settings".
    * **Create/Edit Form (Sidepanel/Sheet):**
        * **General:** Name, Key Name (i18n), Category (Dropdown).
        * **Assets:** URL inputs for Animation/Video.
        * **Defaults Config:** Number inputs for `Target Reps`, `Sets`, `Hold Time (sec)`, and **`Rest Time (sec)`**.

### 2.4 Web Frontend - Routine Builder Refactor
* **Goal:** The Routine Builder (RFC-004) must support the new schema field.
* **Update:** In `/dashboard/patients/[id]/routines/new`:
    * When an exercise is added to the list, the "Rest Time" input must appear in the card.
    * It should auto-fill with the Exercise's default value.
    * It must be editable by the therapist.

---

## 3. Implementation Steps (Agent Instructions)

1.  **Schema First:**
    * Update `schema.prisma`. Add the new field to `RoutineItem`.
    * Update the `seed.ts` to include `rest_seconds` in the generated JSON.
    * Run `pnpm db:push`.

2.  **Backend Logic:**
    * Implement the CRUD Controller/Service for Exercises.
    * Update the `RoutineService` (created in RFC-004) to accept and save `rest_between_sets_seconds` when creating items.

3.  **Frontend - Management Page:**
    * Create the `/dashboard/exercises` page with the Table and Form.

4.  **Frontend - Refactor Builder:**
    * Open the existing Routine Builder component.
    * Add the "Rest Time" input field to the Exercise Configuration Card.
    * Ensure the form payload includes this new field when submitting to `POST /routines`.

---

## 4. Acceptance Criteria

* **[ ] Schema Check:** `RoutineItem` table has the `rest_between_sets_seconds` column.
* **[ ] CRUD works:** Can create a new exercise "Cheek Puff" via the UI and it appears in the list.
* **[ ] Routine Integration:**
    * When adding the new "Cheek Puff" to a routine, the "Rest Time" input defaults to the value set in the catalog.
    * Saving the routine persists the Rest Time in the DB correctly.