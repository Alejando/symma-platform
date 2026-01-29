# RFC-015: Home Screen & Offline Sync Strategy (MOB-5)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-2 (API), RFC-011 (Backend Endpoint) |
| **Scope** | Mobile (`data/local`, `presentation/home`) |
| **Key Tech** | Room Database, Kotlin Flow, Repository Pattern |

## 1. Objective
Implement the Patient's Home Screen.
Critically, this task establishes the **Offline Sync Engine**. The app must fetch the Active Routine from the API and store it locally so the patient can practice without an internet connection.

## 2. Technical Specifications

### 2.1 Local Database (Room)
We need to persist the complex Routine structure.
* **Entities:**
    * `RoutineEntity` (id, name, total_exercises).
    * `ExerciseEntity` (id, name, video_url, config_json).
    * `RoutineItemEntity` (Cross-reference: routine_id, exercise_id, order, target_reps).
* **DAO (`RoutineDao`):**
    * `insertRoutineWithItems(routine, items)` (Transaction).
    * `getActiveRoutineWithExercises()`: Returns a Flow of the populated object.

### 2.2 Repository Strategy (Single Source of Truth)
* **Class:** `RoutineRepositoryImpl`
* **Logic (`refreshRoutine`):**
    1.  Call API `getRoutine()`.
    2.  If success -> Clear old DB data -> Insert new data into Room.
    3.  If fail (No Internet) -> Log error, do nothing (App relies on existing DB data).
* **Logic (`getRoutineFlow`):**
    * Return `routineDao.getActiveRoutine()`.
    * The UI observes *this* Flow, not the API directly.

### 2.3 UI Specifications (Home Screen)
* **Header:** "Good Morning". Date widget.
* **Main Card (Routine):**
    * **State - Loading:** Skeleton card.
    * **State - Content:** Show Routine Title ("Facial Rehab") + "X Exercises".
    * **Action:** "Start Session" Button -> Navigates to Player (Future MOB-6).
    * **State - Empty:** If DB is empty and API fails, show "No routine found. Check internet."

---

## 3. Implementation Steps (Agent Instructions)

1.  **Room Setup:**
    * Create the Entities in `data/local/entity`.
    * Create the `AppDatabase` and `RoutineDao`.
    * Register Database in Hilt Module.

2.  **Repository Logic:**
    * Implement the `sync()` logic. Map API DTOs -> Local Entities.
    * Ensure `insert` is transactional (don't leave half-routines).

3.  **Home ViewModel:**
    * `init { refreshRoutine() }` -> Trigger sync on load.
    * Expose `uiState`: Combines the Room Flow + Loading/Error status.

4.  **UI Construction:**
    * Build `HomeScreen.kt`.
    * Use `collectAsStateWithLifecycle()` to observe the routine.

---

## 4. Acceptance Criteria

* **[ ] Data Persistence:** Login, let the routine sync. Turn on **Airplane Mode**. Kill the app. Re-open. The routine is still visible.
* **[ ] Sync Logic:** Changing the routine on the Web Dashboard and re-opening the App updates the local data.
* **[ ] UI:** The "Start Session" button appears only when a routine is loaded.