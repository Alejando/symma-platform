# RFC-029: Database Seeding for Testing

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | Backend (Prisma Schema) |
| **Scope** | `backend/prisma/seed.ts` |
| **Goal** | Create a script that populates a Test Patient with a Routine containing ALL available exercises. |

## 1. Objective
Automate the creation of a "Golden Scenario" for QA/Testing.
Running `npx prisma db seed` should ensure a specific user exists with a specific routine.

## 2. Data Requirements

### 2.1 The Test User
* **Role:** Patient
* **Email:** `patient@symma.com`
* **Password:** `Patient123!` (Hashed)
* **Name:** "Juan Perez (Test)"

### 2.2 The "All-in-One" Routine
* **Title:** "Full Calibration Protocol"
* **Description:** "Routine containing all gesture types for QA."
* **Day:** 1 (Today)

### 2.3 Exercise Items (The Inventory)
We need to insert one item for each Strategy we implemented in RFC-028.
**Crucial:** The `exerciseId` MUST match the ID expected by the `ExerciseStrategyFactory`.

| Order | Exercise ID | Name | Config (JSON) |
| :--- | :--- | :--- | :--- |
| 1 | `smile_teeth` | Sonrisa con Dientes | `{"difficulty_level": 1.0, "reps": 5}` |
| 2 | `brows_up` | Levantar Cejas | `{"difficulty_level": 1.1, "reps": 5}` (Test Overload) |
| 3 | `jaw_open` | Abrir Boca | `{"difficulty_level": 1.0, "reps": 5}` |
| 4 | `kiss` | Beso (Pucker) | `{"difficulty_level": 0.9, "reps": 5}` (Test Easier) |
| 5 | `blink` | Parpadeo | `{"difficulty_level": 1.0, "reps": 10}` |

## 3. Implementation Steps (Agent Instructions)

1.  **Locate Seed File:** Open `apps/backend/prisma/seed.ts` (or create it if missing).
2.  **Clean Slate:** Optional - clear existing routines for this user to avoid duplicates.
3.  **Upsert User:** Use `prisma.user.upsert` to create the patient if they don't exist.
4.  **Create Routine:** Create the routine connected to the user.
5.  **Create Items:** Use `prisma.routineItem.createMany` to add the exercises listed above.
6.  **Log:** Print "Seed completed: Log in as patient@symma.com".

## 4. Acceptance Criteria
* **[ ] Execution:** Running `npx prisma db seed` completes without errors.
* **[ ] Verification:** Querying the DB shows the user and the routine with 5 items.
* **[ ] Mobile Check:** Logging into the App shows the "Full Calibration Protocol" on the Home Screen.