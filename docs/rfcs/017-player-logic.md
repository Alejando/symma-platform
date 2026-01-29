# RFC-017: Exercise Player Logic & State Machine (MOB-6 Part 2)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-5 (Local DB), RFC-007 (Rest Time Field) |
| **Scope** | Mobile (`presentation/player/viewmodel`, `domain/model`) |
| **Goal** | Manage the complex flow of a therapy session (Exercise -> Rest -> Next Rep). |

## 1. Objective
Implement the `PlayerViewModel` that orchestrates the session.
It must handle the timer, repetition counting, and navigation between exercises WITHOUT worrying about the UI rendering yet.

## 2. Technical Specifications

### 2.1 The State Machine (`PlayerUiState`)
The session is not static. It changes every second.
Define a Sealed Interface `PlayerUiState`:

1.  **`Loading`**: Fetching routine from Room.
2.  **`GetReady`**: Initial 5-second countdown before starting.
3.  **`Exercise`**:
    * `currentExercise`: Exercise Object.
    * `currentRep`: Int (e.g., 1 of 10).
    * `timerSeconds`: Int (Countdown for "Hold Time").
    * `isPaused`: Boolean.
4.  **`Rest`**:
    * `nextExercise`: Exercise Object (preview).
    * `timerSeconds`: Int (Countdown for `rest_between_sets_seconds`).
5.  **`Completed`**: Session finished. Summary data available.

### 2.2 ViewModel Logic (`PlayerViewModel`)
* **Input:** `routineId` (passed via Navigation).
* **Data Source:** Fetch `RoutineWithItems` from `RoutineRepository`.
* **Timer Engine:**
    * Use a `Kotlin Flow` (ticker) that emits every 1 second.
    * **Logic:**
        * If `state == Exercise` && `timer > 0` -> Decrement Timer.
        * If `state == Exercise` && `timer == 0` -> Check Reps.
            * If Reps < Target -> Switch to `Rest` state (if configured) or start next rep immediately.
            * If Reps == Target -> Move to Next Exercise.
        * If `Last Exercise` finished -> Switch to `Completed`.

### 2.3 Audio Cues (Preparation)
* The ViewModel should expose distinct events (Side Effects) for:
    * `PlayTick` (Seconds).
    * `PlayDing` (Rep complete).
    * `PlaySuccess` (Session complete).
    * *Note:* Actual sound implementation can be basic for now.

## 3. Implementation Steps (Agent Instructions)

1.  **State Definition:**
    * Create `PlayerUiState.kt` with the sealed classes defined above.

2.  **ViewModel Skeleton:**
    * Create `PlayerViewModel`. Inject `RoutineRepository`.
    * Load the routine on `init`.

3.  **The Timer Loop:**
    * Implement a robust timer function.
    * Ensure it handles `pause()` and `resume()`.
    * **Crucial:** Use the `rest_between_sets_seconds` field from the DB to determine the duration of the `Rest` state.

4.  **Verification (Log-based):**
    * Since we have no UI for this yet, add `Log.d("PlayerVM", "State: $state")`.
    * Verify in Logcat that the flow goes: `GetReady` -> `Exercise (Rep 1)` -> `Rest` -> `Exercise (Rep 2)`.

---

## 4. Acceptance Criteria

* **[ ] Data Loading:** ViewModel successfully retrieves the list of exercises for the routine.
* **[ ] Flow Logic:**
    * Starts with "Get Ready".
    * Transitions to "Exercise".
    * Counts down correctly (e.g., 5, 4, 3...).
    * Transitions to "Rest" after a rep/set (depending on config).
* **[ ] Completion:** Reaching the end of the last exercise triggers the `Completed` state.
* **[ ] Robustness:** Pausing the timer stops the countdown. Resuming continues it.