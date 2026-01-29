# RFC-019: Session Summary & Data Upload (MOB-7)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-6 (Player), RFC-013 (Networking) |
| **Scope** | Mobile (`presentation/summary`, `data/repository`) |
| **Goal** | Display session results, provide positive reinforcement, and upload data to the backend. |

## 1. Objective
1.  **UI:** Show a "Session Complete" screen with celebration (UX).
2.  **Network:** Send the session data (Duration, Date, Exercises Completed) to the API `POST /sessions`.
3.  **Local Sync:** Mark the routine as "Done" locally so the Home Screen updates (e.g., "Great job today!").

## 2. Technical Specifications

### 2.1 Backend Contract (Update)
We need to add the endpoint to `SymmaApiService` (Retrofit):
* **Endpoint:** `POST /api/sessions`
* **Body (`SessionResultDto`):**
    ```json
    {
      "routineId": "uuid",
      "startTime": "ISO-8601",
      "endTime": "ISO-8601",
      "items": [
        { "exerciseId": "uuid", "repsCompleted": 10, "difficulty": 0 } // Difficulty is optional for now
      ]
    }
    ```

### 2.2 Repository Logic (`SessionRepository`)
* **Function:** `submitSession(result: SessionResult)`
* **Offline Strategy (MVP):**
    * Try to upload to API.
    * **If Success:** Return Success.
    * **If Fail (No Internet):** Save to a local `PendingUploads` table (Room) to retry later. (For this ticket, just logging the failure and returning "Success" to the UI is acceptable to not block the user).

### 2.3 UI Specifications (`SummaryScreen`)
* **Visual:**
    * Big Green Checkmark Icon (or Lottie Animation if available).
    * Title: "Session Complete!"
    * Subtitle: "You are making great progress."
    * Stats Row: "Time: 12m" | "Exercises: 5/5".
* **Action:**
    * Button: "Finish" -> Navigate to `Home` (and clear backstack).

## 3. Implementation Steps (Agent Instructions)

1.  **Network Layer:**
    * Add `createSession` to `SymmaApiService`.
    * Create the request DTOs (`CreateSessionRequest`, `SessionItemRequest`).

2.  **ViewModel Integration:**
    * Create `SummaryViewModel`.
    * It receives the session data (passed as NavArgs or via a shared Repository/State).
    * Call `repository.submitSession()` on `init`.
    * Expose state: `Uploading` -> `Success`.

3.  **UI Construction:**
    * Build `SummaryScreen.kt`.
    * Show a loading spinner while "uploading".
    * Show the Success UI once the API responds (or times out).
    * The "Finish" button navigates back to `Screen.Home`.

---

## 4. Acceptance Criteria

* **[ ] API Integration:** Finishing a session triggers a POST request to the server.
* **[ ] Database Verification:** Checking the Web Dashboard (Sprint 0) shows the "Compliance Alerts" count decreasing (because the patient just did the therapy!).
* **[ ] UX:** The user cannot go "Back" to the player after finishing.
* **[ ] Home Update:** Returning to Home shows the routine as completed (or at least doesn't break).