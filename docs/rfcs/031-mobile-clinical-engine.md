# RFC-031: Mobile Clinical Engine & Eyes Implementation

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-030 (Backend Schema Ready) |
| **Scope** | `Mobile App (Domain, Presentation, Testing)` |
| **Goal** | Implement the Clinical State Machine (Sets/Reps/Hold), the Strategy Pattern, and the specific implementations for Eye Therapy. |

## 1. Domain Layer Updates

### 1.1 Data Models (`RoutineItem.kt`)
We need to map the flat database columns into a structured configuration object for the app logic.

**Enums:**
```kotlin
enum class MobileModule { EYES, EYES_INVERSE, BROWS, JAW, SMILE, KISS, UNKNOWN }
enum class ExerciseType { ISOTONIC, ISOMETRIC }
```

**Config Object:**
```kotlin
data class ExerciseConfig(
    val exerciseType: ExerciseType,
    val sets: Int = 1,
    val reps: Int = 10,
    val restSeconds: Int = 5,
    val holdSeconds: Int = 0, // 0 for Isotonic
    val strictMode: Boolean = false,
    val allowSkip: Boolean = true
)
```

**Routine Item:**
```kotlin
data class RoutineItem(
    val id: String,
    val name: String,
    val module: MobileModule,
    val difficulty: Float,
    val config: ExerciseConfig
)
```

## 2. The Strategy Pattern (Math Engine)

We isolate the computer vision math from the UI logic.

### 2.1 Interface
```kotlin
interface ExerciseStrategy {
    /**
     * @return Float 0.0 to 1.0 (Progress). values > 1.0 indicate "Overachieving" (Green).
     */
    fun calculateScore(
        blendshapes: FaceBlendshapes, 
        baseline: CalibrationBaseline, 
        difficulty: Float
    ): Float
}
```

### 2.2 Implementations

**A. `EyesStrategy` (Standard - Close Eyes)**
* **Logic:** `eyeBlink` blendshape goes from 0.0 (Open) to 1.0 (Closed).
* **Goal:** Reach a high value (Closing eyes tightly).
* **Formula:** `score = currentAvg / (baseline.eyesClosedMax * difficulty)`

**B. `EyesInverseStrategy` (Inverse - Open Eyes)**
* **Logic:** `eyeBlink` blendshape goes from 0.0 (Open) to 1.0 (Closed).
* **Goal:** Reach a LOW value (Opening eyes wide).
* **Formula:** Since the UI expects a progress bar filling up (0->100%), we invert the math.
    * `invertedCurrent = 1.0 - currentAvg`
    * `invertedBaseline = 1.0 - baseline.eyesOpenMin` (Assuming baseline captured minimum blink)
    * `score = invertedCurrent / invertedBaseline`
    * *Fallback:* Simply `score = (1.0 - currentAvg)` if baseline is noisy.

## 3. PlayerViewModel State Machine (The Brain)

We must replace the simple timer with a **Clinical Loop**.

### 3.1 State Variables
* `currentSet`: Int (1..N)
* `currentRep`: Int (1..N)
* `accumulatedHoldTimeMs`: Long (Tracks time held *inside* the current rep)
* `isTargetReached`: Boolean (True if Score >= 1.0)

### 3.2 Logic Flow (Frame-by-Frame)

**On `processFrame(score)`:**

1.  **Check Target:**
    * If `score >= 1.0`: Set `isTargetReached = true`.
    * If `score < 1.0`: Set `isTargetReached = false`.
        * **Strict Mode Check:** If `config.strictMode == true` AND `config.exerciseType == ISOMETRIC`, reset `accumulatedHoldTimeMs = 0`. (User was holding, then slipped -> Fail).

2.  **Time Accumulation (The "Hold"):**
    * If `isTargetReached == true`, add `deltaTime` to `accumulatedHoldTimeMs`.

3.  **Completion Logic:**
    * **Isometric:** If `accumulatedHoldTimeMs >= config.holdSeconds`: **Rep Complete**.
    * **Isotonic:** If `isTargetReached` goes `False -> True` (Edge detection) AND `holdSeconds == 0`: **Rep Complete**.

4.  **Transition Logic (On Rep Complete):**
    * Reset `accumulatedHoldTimeMs`.
    * Increment `currentRep`.
    * **If `currentRep > config.reps`:**
        * **Set Finished.**
        * **If `currentSet < config.sets`:**
            * Trigger `PlayerUiState.Rest`.
            * Start Rest Timer.
            * On Timer End -> Increment `currentSet`, Reset `currentRep` to 1, Resume Exercise.
        * **Else:** Exercise Finished (Next Item).

## 4. Testing Strategy (Mandatory)

### 4.1 Unit Tests (`StrategiesTest.kt`)
* **Test Standard:** Mock Blendshapes with 0.8 blink. Baseline max 0.8. Difficulty 1.0. Assert Score == 1.0.
* **Test Inverse:** Mock Blendshapes with 0.0 blink (Wide Open). Assert Score approaches 1.0.

### 4.2 Unit Tests (`PlayerViewModelTest.kt`)
* **Test Strict Mode:**
    * Simulate Score 1.0 (Holding) -> `accumulatedHoldTime` increases.
    * Simulate Score 0.4 (Slip) -> `accumulatedHoldTime` drops to 0.
* **Test Sets Transition:**
    * Finish last rep of Set 1.
    * Assert State becomes `Rest`.
    * Assert `currentSet` remains 1 until Rest finishes.

## 5. Acceptance Criteria

* **[ ] Data Mapping:** The app correctly parses the `ExerciseConfig` from the Routine.
* **[ ] Strategy Selection:** `MobileModule.EYES` loads `EyesStrategy` and `EYES_INVERSE` loads `EyesInverseStrategy`.
* **[ ] Visual Feedback:** The UI displays "Set 1/3 - Rep 5/10".
* **[ ] Isometric Logic:** The repetition counter *only* increases if the user holds the target for the required time.
* **[ ] Strict Mode:** Losing the facial gesture resets the hold timer (verified via Unit Test).
* **[ ] Rest Phase:** The app pauses and shows a "Rest" screen between sets.