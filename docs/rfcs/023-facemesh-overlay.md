# RFC-023: Face Mesh Overlay & Visual Debugging (MOB-9)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-022 (MediaPipe Setup) |
| **Scope** | `presentation/components/camera`, `core/cv` |
| **Goal** | Draw the 468 facial landmarks on screen to verify alignment and coordinate scaling. |

## 1. Objective
Visualize the MediaPipe data.
We need a translucent layer on top of the Camera Preview that renders points/lines corresponding to the detected face.
**Critical Success Factor:** The "Mask" must stick to the face perfectly, even when the user moves or rotates their head.

## 2. Technical Specifications

### 2.1 Coordinate System Challenge
MediaPipe returns **Normalized Coordinates** (0.0 to 1.0), where (0,0) is top-left and (1,1) is bottom-right of the **Image Buffer**, NOT the Screen.
* **Challenge:** The Camera Image buffer might be 4:3 (e.g., 640x480), but the Screen is 20:9.
* **Solution:** We must implement a **Coordinate Transformer** that scales the normalized points to the actual `Canvas` size, accounting for "Center Crop" scaling if the preview is cropped.

### 2.2 The Overlay Component (`FaceMeshOverlay`)
* **Tech:** Jetpack Compose `Canvas`.
* **Input:** `FaceLandmarkerResult` (State).
* **Logic:**
    * Iterate through the landmarks.
    * Transform `(x, y)` -> `(canvasX, canvasY)`.
    * `drawCircle` (Green, radius 2dp) for key points (Lips, Eyes).
    * `drawPoints` (White, smaller) for the mesh.

### 2.3 Integration
* Update `PlayerScreen.kt`.
* Insert the `FaceMeshOverlay` in the `Box`, strictly **between** the Camera and the UI Controls.
* Pass the stream of results from the `FaceLandmarkerHelper` to this overlay.

## 3. Implementation Steps (Agent Instructions)

1.  **Coordinate Logic:**
    * Create `core/cv/OverlayView.kt` (or Composable equivalent).
    * Implement a function `mapCoordinates(x: Float, y: Float, viewWidth: Int, viewHeight: Int): Pair<Float, Float>`.
    * *Note:* For MVP, simple scaling `x * width` is enough IF the aspect ratios match. If not, add scaling logic.

2.  **Visual Component:**
    * Create `FaceMeshOverlay.kt`.
    * It observes the latest Face Result.
    * Draws key landmarks:
        * **Lips:** Indices 61, 291, 0, 17 (corners & center).
        * **Eyes:** Indices 33, 263.

3.  **Wiring:**
    * In `PlayerViewModel`, expose a `StateFlow<FaceLandmarkerResult?>`.
    * Update `FaceLandmarkerListener` to emit results to the ViewModel.
    * In `PlayerScreen`, collect this flow and pass it to the Overlay.

---

## 4. Acceptance Criteria

* **[ ] Synchronization:** The green dots move instantly with the face (Low latency).
* **[ ] Alignment:** Touching your nose matches the "Nose Landmark" on screen.
* **[ ] Orientation:** If I tilt my head left, the mesh tilts left. (Verifies rotation handling).
* **[ ] Mirroring:** If I wink my left eye, the "Left Eye" on screen reacts.