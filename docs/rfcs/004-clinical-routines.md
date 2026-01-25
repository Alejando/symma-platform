# RFC-004: Clinical Routines & Exercise Configuration

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-003 (Patient Management) |
| **Scope** | Backend (Transactions + Tests), Web (Complex Form), DB (Seeding) |
| **Design Ref** | [Routine Builder Mockup](https://stitch.withgoogle.com/preview/9466613625641761347?node-id=380bd09c6b874c729bbaaee9f6360c1c) |
| **Schema Ref** | `docs/technical_brief.md` & `packages/database/schema.prisma` |

## 1. Objective
Enable Therapists to build personalized rehabilitation routines.
This includes:
1.  **Exercise Catalog:** Selecting exercises from a seeded list.
2.  **Configuration:** Setting specific parameters per exercise (`target_reps`, `hold_time`, etc.) as defined in the schema.
3.  **Ordering:** Ability to reorder exercises within the routine (Sequence matters).
4.  **Assignment:** Saving the Routine + RoutineItems transactionally.

## 2. Technical Specifications

### 2.1 Database Models & Seeding
* **Source of Truth:** Refer to **`docs/technical_brief.md`** or `schema.prisma` for the exact attributes of `Routine` and `RoutineItem`.
* **Seed Data:** Ensure the `Exercise` table is populated with at least 4 types (Smile, Brow Raise, etc.) containing valid `default_config` JSON.

### 2.2 Backend API (NestJS) + Testing
* **Module:** `RoutinesModule`.
* **Endpoints:**
    * `GET /exercises`: List available exercises.
    * `POST /routines`: Create Routine + Create multiple `RoutineItems` (Prisma Transaction).
    * `PUT /routines/:id`: Update Routine details AND update/reorder items.
* **Logic - Reordering:**
    * The API expects an array of items. The backend must save the `orderIndex` based on the position in the received array (0, 1, 2...).
* **Testing (Unit Tests):**
    * `RoutinesService.create`: Verify it creates 1 Routine and N RoutineItems.
    * `RoutinesService.create`: Verify validation (Start Date < End Date).

### 2.3 Web Frontend (Next.js) + Responsiveness
* **UI Reference:** Follow the **Mockup** provided in metadata strictly for layout.
* **Form Logic:**
    * **Dynamic List:** Allow adding/removing exercises.
    * **Configuration:** Each added exercise must show inputs for:
        * `Target Reps` (Int)
        * `Target Sets` (Int)
        * `Hold Time` (Seconds)
    * **Reordering:** Implement "Move Up" / "Move Down" buttons (or Drag & Drop) that update the visual order before saving.
* **Responsiveness:**
    * On Mobile: The configuration row (Reps/Sets/Hold) should wrap or stack vertically.

---

## 3. Implementation Steps (Agent Instructions)

1.  **Analyze Schema:** Read `packages/database/schema.prisma` to understand the relation `Routine -> RoutineItem`.
2.  **Backend Implementation:**
    * Implement `CreateRoutineDto` that includes an array of `items`.
    * Use `prisma.$transaction` or nested writes to ensure data integrity.
    * Implement Unit Tests for the Service logic.
3.  **Frontend Implementation:**
    * Build the "Routine Builder" page matching the Mockup.
    * Fetch Exercises from API to populate the "Add Exercise" dropdown.
    * State Management: Use a local state array (e.g., `exercisesList`) to handle the order and values before sending to API.
    * **Validation:** Ensure inputs (Reps/Sets) are numbers > 0.

---

## 4. Acceptance Criteria

* **[ ] Check 1: Schema Compliance**
    * Created routines in DB have correct attributes (`target_reps`, `hold_time_seconds`, `order_index`) matching `docs/technical_brief.md`.
* **[ ] Check 2: Transactional Integrity**
    * Action: Create a routine with 3 exercises.
    * *Success:* DB shows 1 record in `Routine` and 3 records in `RoutineItem` linked correctly.
* **[ ] Check 3: Reordering**
    * Action: Add "Smile" then "Blink". Move "Blink" up. Save.
    * *Success:* In DB, "Blink" has `orderIndex: 0` and "Smile" has `orderIndex: 1`.
* **[ ] Check 4: Responsive UI**
    * Action: Open builder on mobile view (375px). Inputs are accessible and not overflowing.
    * Tests: Backend unit tests pass.