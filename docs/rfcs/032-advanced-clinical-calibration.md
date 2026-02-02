# RFC-032: Advanced Clinical Calibration System (Robustness Upgrade)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-8 (MediaPipe), RFC-030 (Data Models) |
| **Scope** | `Mobile App (Calibration Logic)`, `UI/UX` |
| **Goal** | Implement a noise-resistant calibration flow using P95 statistics, Neutral "Tare" offsets, and Head Pose stability checks. |

## 1. Objective & Problem Statement
The previous "3-second max" approach is vulnerable to camera noise (glitches) and user error (moving the head while gesturing).
**Goal:** We need a system that captures the **True Clinical Maximum** (MVC) while rejecting noise and compensating for the patient's resting asymmetry.

## 2. Technical Specifications (The "Math")

### 2.1 The "Tare" Logic (Neutral Offset)
Patients with facial paralysis often do not start at 0.0.
* **Concept:** Measure the "Resting Face" values first.
* **Formula:** `EffectiveValue = max(0, RawValue - NeutralOffset)`
* *Example:* If a patient's resting mouth is slightly open (0.1), and they open it to 0.6.
    * Old Method: Range = 0.6.
    * New Method: Range = 0.6 - 0.1 = **0.5 (True Effort)**.

### 2.2 Noise Filtering (P95 Statistics)
To avoid camera glitches (sudden spikes to 1.0) ruining the calibration.
* **Logic:** Collect all samples during the capture window (e.g., 30 samples/sec * 3 sec = 90 samples).
* **Algorithm:**
    1.  Sort the samples ascending.
    2.  Discard the top 5% (The noise outliers).
    3.  Take the max of the remaining values.
    * *Result:* A value that the user *consistently* reached, not just a random spike.

### 2.3 Head Stability Guard
Gestures must be performed with the face, not by moving the neck.
* **Logic:** Calculate Head Pose (Yaw/Pitch/Roll) or simply monitor Face Bounding Box velocity.
* **Threshold:** If head rotation > 10° or Position Shift > 5% of screen width -> **PAUSE CAPTURE**.
* **Feedback:** UI shows "Keep Head Still" (Mantén la cabeza quieta).

## 3. User Experience Flow (The "Wizard")

### Phase 0: Positioning (The Silhouette)
* **UI:** Overlay a semi-transparent face silhouette (Outline).
* **Logic:**
    * Check `FacePresence`.
    * Check `Distance` (via Iris size or Face bounding box area relative to screen).
    * **Action:** Only enable the "Start" button when the user fits the silhouette.

### Phase 1: Neutral Capture (The "Tare")
* **Instruction:** "Relaja tu rostro y mira al frente."
* **Duration:** 2 Seconds.
* **Outcome:** Save `CalibrationBaseline.neutralOffsets` map (e.g., `{ jawOpen: 0.05, eyeBlink: 0.02 }`).

### Phase 2: Active Gestures (Iterative)
Repeat for each module (Eyes, Brows, Smile, Kiss, Jaw):

1.  **Instruction:** Show Lottie/GIF of the gesture.
2.  **Trigger:** User starts moving.
3.  **Capture Loop (3 Seconds):**
    * **Condition:** `HeadStability == OK` AND `Intensity > Threshold`.
    * **Visual:** A circular progress bar fills up as time passes.
    * **Audio:** Tick sound every second.
    * **Error:** If head moves, bar pauses and turns Orange.
4.  **Completion:**
    * **Processing:** Calculate P95 Max.
    * **Feedback:** Success Sound ("Ding!") + Haptic Vibration.
    * **Transition:** Auto-advance to next step.

## 4. Implementation Details (Architecture)

### 4.1 Data Model: `CalibrationBaseline` Update

```kotlin
data class CalibrationBaseline(
    // The Active Max Values (P95)
    val eyesClosedMax: Float = 0.5f,
    val smileMax: Float = 0.5f,
    // ... other max values ...

    // The Neutral Offsets (Tare)
    val neutralOffsets: Map<String, Float> = emptyMap()
)
```

### 4.2 `CalibrationViewModel` Logic

```kotlin
class CalibrationViewModel {
    // Buffers for statistical analysis
    private val sampleBuffer = mutableListOf<Float>()
    
    // State
    val isHeadStable: Boolean
    val calibrationProgress: Float // 0.0 to 1.0 (Time)
    
    fun processFrame(blendshapes: FaceBlendshapes, matrix: Matrix) {
        // 1. Check Stability
        if (!checkStability(matrix)) {
            uiState.value = Error("Don't move your head")
            return
        }
        
        // 2. Extract Value based on current step (e.g., Smile)
        val rawValue = extractValue(blendshapes)
        
        // 3. Apply Neutral Offset (if in Active Phase)
        val neutral = baseline.neutralOffsets[currentStep.key] ?: 0f
        val correctedValue = (rawValue - neutral).coerceAtLeast(0f)
        
        // 4. Accumulate
        sampleBuffer.add(correctedValue)
        
        // 5. Check Time
        if (bufferSize > REQUIRED_SAMPLES) {
            val finalMax = calculateP95(sampleBuffer)
            saveAndAdvance(finalMax)
        }
    }
}
```

## 5. Acceptance Criteria

* **[ ] Robustness:** A sudden camera glitch (spike to 1.0) is IGNORED by the P95 algorithm.
* **[ ] Stability:** Moving the phone or head pauses the timer immediately.
* **[ ] Neutrality:** A user with a naturally open mouth (0.1) who opens to 0.5 gets a score relative to 0.4 range, not 0.5 absolute.
* **[ ] Feedback:** The user receives Auditory and Haptic feedback upon completing a step.
* **[ ] Guidance:** The Silhouette guide prevents the user from starting if they are too far/close.