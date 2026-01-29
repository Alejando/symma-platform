# RFC-024: Facial Symmetry Analysis Algorithm (MOB-10)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-9 (Visual Debugging verified) |
| **Scope** | `core/cv/analysis`, `domain/model` |
| **Goal** | Implement the math to quantify facial symmetry in real-time. |

## 1. Objective
Create a `SymmetryAnalyzer` that consumes the Face Mesh landmarks and outputs a **Symmetry Score (0-100%)**.
For Sprint 2, we will focus on **Mouth/Smile Symmetry** as the primary metric, as it's the most common exercise for facial palsy.

## 2. Technical Specifications

### 2.1 The Math (Simplified for MVP)
To avoid complex 3D rotation matrix math initially, we will use a **Relative Distance** approach:

1.  **Define the Center Axis:** Use the **Nose Tip** (Index 1) and **Chin** (Index 152) to define the face's vertical midline.
2.  **Key Points:**
    * **Left Mouth Corner:** Index 61.
    * **Right Mouth Corner:** Index 291.
    * **Mouth Center:** Index 0 (Upper lip center) or 13 (Inner lips).
3.  **Calculation:**
    * Calculate the Euclidean distance from **Mouth Center** to **Left Corner** ($d_L$).
    * Calculate the Euclidean distance from **Mouth Center** to **Right Corner** ($d_R$).
    * **Symmetry Ratio:**
        $$Score = \left( 1 - \frac{|d_L - d_R|}{\max(d_L, d_R)} \right) \times 100$$
4.  **Interpretation:**
    * If distances are equal ($d_L = d_R$), Score = 100%.
    * If one side is paralyzed (little movement) and the other moves, the difference grows, and the score drops.

### 2.2 Data Structure
* **Input:** List of 468 `NormalizedLandmark`.
* **Output:** `AnalysisResult` data class:
    * `symmetryScore`: Int (0-100).
    * `deviation`: Float (Raw difference).
    * `isBalanced`: Boolean (Threshold > 80%).

## 3. Implementation Steps (Agent Instructions)

1.  **The Calculator Class:**
    * Create `core/cv/SymmetryCalculator.kt`.
    * Implement `fun calculateSmileSymmetry(landmarks: List<NormalizedLandmark>): Int`.
    * *Helper Math:* Implement a `distance(p1, p2)` function using basic Pythagorean theorem: $\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.

2.  **Integration into ViewModel:**
    * Inject `SymmetryCalculator` into `PlayerViewModel`.
    * Inside the `FaceLandmarkerListener` callback:
        1.  Receive landmarks.
        2.  Run calculation.
        3.  Update a new StateFlow: `symmetryScore`.

3.  **Visual Verification (Logcat):**
    * Log the score: `Log.d("Symmetry", "Score: $score% (L=$distLeft vs R=$distRight)")`.

---

## 4. Acceptance Criteria

* **[ ] Neutral Face:** Looking straight at the camera with a neutral expression gives a high score (90-100%).
* **[ ] Symmetrical Smile:** A big, even smile gives a high score.
* **[ ] Fake Paralysis:** Smirking only on one side (moving one corner while keeping the other still) significantly drops the score (e.g., < 60%).
* **[ ] Robustness:** Small head rotations don't drastically break the score (using Relative Distance helps with this).