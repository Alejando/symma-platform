# RFC-028: Clinical Exercise Engine & Difficulty Tuning

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-027 (Calibration System) |
| **Scope** | `core/cv/exercises`, `domain/model` |
| **Goal** | Modularize exercise logic and implement the "Therapist Difficulty Override". |

## 1. The Strategy Pattern

Instead of hardcoding logic inside the ViewModel, we use Strategies.

### 1.1 The Interface

    interface ExerciseStrategy {
        val id: String // e.g. "smile_teeth"
        
        /**
         * Calculates the patient's performance score (0.0 to 1.0+)
         * @param blendshapes Current frame data
         * @param baseline User's calibrated maximums
         * @param difficultyFactor 1.0 = Normal. >1.0 = Harder (Overload). <1.0 = Easier.
         */
        fun calculateScore(
            blendshapes: FaceBlendshapes, 
            baseline: CalibrationBaseline,
            difficultyFactor: Float 
        ): Float
    }

## 2. Difficulty Logic (The New Requirement)
The `difficultyFactor` comes from the Routine configuration (Backend/Therapist).

* **Formula:** `Target = Baseline * DifficultyFactor`
* **Score:** `CurrentValue / Target`

**Example (Jaw Open):**
* Patient Baseline (Max Open): `0.5`
* Therapist Setting (Force Effort): `1.1` (110%)
* **New Target:** `0.5 * 1.1 = 0.55`
* Result: The patient must open *wider* than their initial calibration to hit 100% on the bar.

## 3. Strategies Implementation (Formulas)

### A. Smile Strategy (`SMILE_TEETH` / `SMILE_CLOSED`)
* **Blendshapes:** `mouthSmileLeft`, `mouthSmileRight`.
* **Formula:**

    val currentAvg = (shapes.mouthSmileLeft + shapes.mouthSmileRight) / 2f
    val target = baseline.mouthSmileMax * difficultyFactor
    return currentAvg / target

### B. Brows Strategy (`BROWS_UP`)
* **Blendshapes:** `browInnerUp`, `browOuterUpLeft`, `browOuterUpRight`.
* **Formula:**

    val currentAvg = (shapes.browInnerUp + shapes.browOuterUpLeft + shapes.browOuterUpRight) / 3f
    val target = baseline.browRaiseMax * difficultyFactor
    return currentAvg / target

### C. Jaw Strategy (`JAW_OPEN`)
* **Blendshapes:** `jawOpen`.
* **Formula:**

    val target = baseline.mouthOpenMax * difficultyFactor
    return shapes.jawOpen / target

### D. Kiss Strategy (`KISS`)
* **Blendshapes:** `mouthPucker`.
* **Formula:**

    val target = baseline.duckFaceMax * difficultyFactor
    return shapes.mouthPucker / target

## 4. Integration Steps

1.  **Backend Config Parsing:** Ensure the `RoutineItem` entity parses the `config` JSON to extract `difficulty_level` (float, default 1.0).
2.  **Factory:** Create `ExerciseStrategyFactory.getStrategy(id: String)`.
3.  **PlayerVM:**
    * Retrieve the `difficulty_level` from the current Routine Item.
    * On every frame, call: `strategy.calculateScore(shapes, baseline, difficulty)`.
    * Update the UI Progress Bar with the result.

## 5. Acceptance Criteria
* **[ ] Normalization:** A "Half smile" during calibration followed by a "Half smile" during exercise results in 100% Score (at 1.0 difficulty).
* **[ ] Overload:** Setting difficulty to `1.2` makes the green bar harder to reach (requires exaggeration).
* **[ ] Modular:** Adding a new exercise (e.g., "Wink") only requires adding a new Strategy class, not changing the ViewModel.