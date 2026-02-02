# RFC-027: User Calibration System (Baseline Capture)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-8 (MediaPipe Integration) |
| **Scope** | `domain/calibration`, `presentation/calibration` |
| **Goal** | Establish a "Baseline" of the user's maximum range of motion to normalize exercise scoring. |

## 1. Technical Specifications

### 1.1 MediaPipe Config Update
* **Task:** Update `FaceLandmarkerHelper`.
* **Change:** Set `FaceLandmarker.Options.outputFaceBlendshapes = true`.
* **Output:** Now access `result.faceBlendshapes().get()` which returns 52 float coefficients (0.0 - 1.0).

### 1.2 Data Model: `CalibrationBaseline`
This object persists throughout the session (Singleton or Session Scoped). It represents the maximum extent the user can reach for each gesture.

    data class CalibrationBaseline(
        val mouthOpenMax: Float = 0.5f,    // Fallback default
        val mouthSmileMax: Float = 0.5f,
        val browRaiseMax: Float = 0.5f,
        val duckFaceMax: Float = 0.5f,     // For Kiss exercise
        val eyesClosedMax: Float = 0.8f,
        val jawLeftMax: Float = 0.3f,      // Optional for advanced jaw
        val jawRightMax: Float = 0.3f
    )

### 1.3 The Calibration State Machine (`CalibrationViewModel`)
We implement a "Wizard" flow. The user must hold each pose for ~3 seconds to capture a stable maximum.

* **Steps:**
    1.  **Neutral:** Capture noise floor (ensure face is detected).
    2.  **Max Smile:** Captures average of `mouthSmileLeft` + `mouthSmileRight`.
    3.  **Max Surprise:** Captures `browInnerUp` + `browOuterUpLeft/Right`.
    4.  **Max Kiss:** Captures `mouthPucker`.
    5.  **Max Jaw:** Captures `jawOpen`.

**Logic (The Accumulator):**
During the capture window (`isCapturing == true`), iterate through incoming Blendshapes frames and store the **Maximum Value** observed.

    Pseudo-code:
    currentMax = max(currentMax, incomingValue)

## 2. Implementation Steps

1.  **MediaPipe:** Enable blendshapes in `FaceLandmarkerHelper`.
2.  **ViewModel:** Create `CalibrationViewModel`.
    * Implement `startCapture(step)`: Resets current max to 0.
    * Implement `stopCapture()`: Saves the found max to the `CalibrationBaseline`.
3.  **UI:** Create `CalibrationScreen`.
    * Simple Step-by-Step wizard.
    * Instructions: "Smile as hard as you can!".
    * Visual Feedback: A simple progress bar showing current intensity helps the user know they are being detected.
4.  **Persistence:** Pass the final `CalibrationBaseline` to `PlayerViewModel` (via Navigation Arguments or a Shared Repository).

## 3. Acceptance Criteria
* **[ ] Data:** Logging the `CalibrationBaseline` shows values specific to the user (e.g., small smile = low max, big smile = high max).
* **[ ] Flow:** The user must complete all calibration steps before the Routine starts.
* **[ ] Stability:** If the user moves their head, the blendshape values remain relatively stable (MediaPipe handles this well).