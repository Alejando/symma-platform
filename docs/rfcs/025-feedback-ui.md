# RFC-025: Real-Time Biofeedback UI & Rep Logic (MOB-11)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-024 (Symmetry Logic) |
| **Scope** | `presentation/player`, `domain/model` |
| **Goal** | Translate the raw Symmetry Score into a visual "Traffic Light" system for the patient. |

## 1. Objective
Create a visual indicator (Quality Bar) that tells the patient how symmetric their movement is.
* **Psychological Goal:** Positive reinforcement. When the bar turns **Green**, the patient knows they are succeeding.

## 2. Technical Specifications

### 2.1 Visual "Traffic Light" Logic
We will map the `symmetryScore` (0-100) to colors:
* **Green (Good):** Score ≥ 80% (Threshold for "Success").
* **Yellow (Warning):** Score 50% - 79% (Needs improvement).
* **Red (Poor):** Score < 50% (Visible asymmetry).

### 2.2 The Component (`SymmetryBar`)
* **Type:** A Vertical or Horizontal Progress Indicator.
* **Animation:** Smooth transition between values (`animateFloatAsState`).
* **Location:** Next to the camera overlay or integrated into the HUD.

### 2.3 Updated "Hold" Logic (The 'Smart' Timer)
Currently, the timer just counts down (5, 4, 3...). We will upgrade it to a **Quality-Gated Timer**:
* **Rule:** The "Hold" timer ONLY counts down if the symmetry is **Green** (or at least Yellow).
* **Feedback:** If the user relaxes too much (Red), the timer **PAUSES** and says "Keep holding!".
* *Note for MVP:* To avoid frustration, we can make the timer *slow down* instead of full pause, or just warn the user but let them finish. Let's start with **Visual Warning Only** (Timer continues, but bar is Red).

## 3. Implementation Steps (Agent Instructions)

1.  **Component Creation:**
    * Create `presentation/components/feedback/QualityBar.kt`.
    * Input: `score: Int`.
    * Logic: Determine color based on thresholds.
    * UI: A nice rounded bar that fills up.

2.  **Screen Integration:**
    * Add `QualityBar` to `PlayerOverlay`.
    * Connect it to `viewModel.symmetryScore`.

3.  **Feedback Text:**
    * Add a dynamic text message below the timer:
        * Green -> "Great job!"
        * Yellow -> "Almost there..."
        * Red -> "Try to balance both sides."

---

## 4. Acceptance Criteria

* **[ ] Visual Response:** Making a symmetrical smile turns the bar Green.
* **[ ] Real-time:** Smirking (one side only) drops the bar to Red/Yellow instantly.
* **[ ] Smoothness:** The bar doesn't "jitter" crazily (use animation or a simple moving average if needed).
* **[ ] Motivation:** The text updates to encourage the user.