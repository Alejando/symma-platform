# RFC-026: AI Metrics Aggregation & Upload (MOB-12)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-025 (Feedback UI), RFC-019 (Session Upload) |
| **Scope** | `Mobile (Logic)`, `Backend (DTO)` |
| **Goal** | Capture the symmetry scores generated during the session and send them to the Therapist's Dashboard. |

## 1. Objective
Transform the real-time stream of numbers into a persistent clinical record.
We need to calculate the **Average Symmetry** for each exercise and include it in the final report sent to the API.

## 2. Technical Specifications

### 2.1 Aggregation Logic (The "Sampling" Strategy)
We cannot save every single frame (30 data points per second is too much).
* **Strategy:** "Sampling during Hold Phase".
* **Logic:**
    1.  Create a list `currentRepScores: MutableList<Int>`.
    2.  **While State == EXERCISE (and Timer is running):** Add the current `symmetryScore` to the list every ~500ms.
    3.  **On Rep Complete:** Calculate `repAverage = scores.average()`. Store it.
    4.  **On Exercise Complete:** Calculate `exerciseAverage = allReps.average()`.

### 2.2 Data Structure Update
* **Mobile (`SessionResult`):** Update the internal model to hold `accuracy: Int` (mapped from Symmetry).
* **Backend DTO (`CreateSessionItemDto`):**
    * Add optional field: `averageAccuracy: number`.
    * Update `POST /sessions` handler to save this to the database.

### 2.3 Edge Cases
* **Zeros:** If the user face was not detected, ignore those frames (don't let a "0" drag down the average).
* **Rest:** Do not record scores during the "Rest" or "Get Ready" phases.

## 3. Implementation Steps (Agent Instructions)

1.  **Backend Update (NestJS):**
    * Update `CreateSessionDto` in the Backend codebase.
    * Ensure Prisma Schema `SessionItem` has a column for accuracy (or add it if missing).

2.  **Mobile Logic (`PlayerViewModel`):**
    * Implement the `SampleCollector`.
    * During the `ticker` (timer loop), if `state == Exercise`, add `_symmetryScore.value` to the collector.
    * When moving to next exercise, compute the final average and attach it to the `SessionItemResult`.

3.  **API Client Update:**
    * Update `SymmaApiService` to send this new field in the JSON body.

---

## 4. Acceptance Criteria

* **[ ] Logic:** The app calculates a realistic average (e.g., if I held the bar mostly green, the result is ~85%).
* **[ ] JSON Payload:** Intercepting the network request shows `"averageAccuracy": 85` inside the items list.
* **[ ] Database:** The value persists in the Backend database.