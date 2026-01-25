# RFC-008: Routine Lifecycle (Edit, Archive, Clone)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-004 (Builder), RFC-007 (Schema/Exercise Mgmt) |
| **Scope** | Backend (Guards + Clone Logic), Frontend (Smart Form) |
| **Key Principle** | **Data Integrity:** Never alter the definition of a routine that has historical data. |

## 1. Objective
Implement the full lifecycle management for Routines.
Therapists must be able to **Edit** mistakes, **Archive** old routines, and **Clone** successful routines to iterate on them (Versioning), all while protecting the integrity of existing session data (preventing "Data Drift").

## 2. Technical Specifications

### 2.1 Backend API (NestJS)
* **Update Endpoint:** `PUT /routines/:id`
    * **Logic:** Check `prisma.session.count({ where: { routineId } })`.
    * **Guard (Active Routine):** If `count > 0`, **REJECT** any changes to `items` (Exercises list, Reps, Sets). Only allow updates to `name`, `description`, `startDate`, `endDate`.
    * **Allow (New Routine):** If `count == 0`, allow full modification (Add/Remove exercises, change targets).
    * **Constraint:** Ensure `rest_between_sets_seconds` is preserved/updated correctly.

* **Delete Endpoint:** `DELETE /routines/:id`
    * **Logic:** Check `count > 0`.
    * **Soft Delete:** If `true` -> Update `status` to `ARCHIVED`. (Do not remove row).
    * **Hard Delete:** If `false` -> Delete row from DB.

* **Clone Endpoint (New):** `POST /routines/:id/clone`
    * **Logic:**
        1.  Fetch original Routine + Items.
        2.  Create a **NEW** Routine record (New UUID).
        3.  **Deep Copy:** Copy all associated `RoutineItems` to the new ID.
        4.  **Reset:** Set `start_date` = Today, `sessions_count` = 0, `status` = 'ACTIVE'.
        5.  Return the new Routine ID.

### 2.2 Web Frontend (Next.js)
* **Refactor:** Extract form logic to `<RoutineForm initialData={...} isLocked={boolean} />`.
* **Smart UI:**
    * **Locked Mode:** If `isLocked` is true (routine has sessions):
        * Disable inputs for Reps, Sets, Hold Time, Rest Time.
        * Hide "Add Exercise" / "Remove" buttons.
        * Show Alert: *"Routine is active. Clone to edit exercises."*
    * **Edit Mode:** If `isLocked` is false, allow full interaction.
* **Actions:**
    * **Clone Button:** In the Routine Detail Header, adds a "Duplicate" action that calls the Clone endpoint and redirects to the *New* routine's edit page.
    * **Delete Button:** Calls the delete endpoint. If success, redirect to Patient Profile.

---

## 3. Implementation Steps (Agent Instructions)

1.  **Backend - Clone & Guards:**
    * Implement `POST /clone`. Ensure it performs a transaction to copy header + items.
    * Implement the "Has Sessions" check in `update` and `remove` services.

2.  **Frontend - Form Refactor:**
    * Refactor `routines/new` to use a reusable `<RoutineForm />`.
    * Implement the `disabled` state logic based on the `isLocked` prop.

3.  **Frontend - Integration:**
    * Create the Edit Page: `/dashboard/patients/[id]/routines/[routineId]/edit`.
    * Wire up the Clone and Delete buttons in the UI.

---

## 4. Acceptance Criteria (Verification Checklist)

* **[ ] Scenario 1: Clean Edit (Pre-Start)**
    * **Action:** Create a routine (0 sessions). Change "10 reps" to "20 reps". Save.
    * **Result:** The changes are persisted in the DB.
* **[ ] Scenario 2: Locked Edit (Active)**
    * **Action:** Seed 1 session for a routine. Try to edit Reps/Sets in UI.
    * **Result:** Inputs are **Disabled**. API rejects changes to items if forced via Postman. Only Name/Dates can be changed.
* **[ ] Scenario 3: Hard Delete (Cleanup)**
    * **Action:** Create a routine. Immediately Delete it.
    * **Result:** The record is **removed** completely from the Database (Row count decreases).
* **[ ] Scenario 4: Soft Delete (Archival)**
    * **Action:** Delete a routine that has Sessions.
    * **Result:** The record persists in DB but `status` is `ARCHIVED`. It disappears from the "Active" list in the Profile.
* **[ ] Scenario 5: Cloning (Evolution)**
    * **Action:** Click "Clone" on a routine with history.
    * **Result:** A **NEW** routine is created with the same exercises. It has 0 sessions and is fully editable.