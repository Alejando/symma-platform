# RFC-022: MediaPipe Face Mesh Integration (MOB-8)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | Sprint 1 (CameraX Infrastructure) |
| **Scope** | `core/cv` (Computer Vision), `presentation/components/camera` |
| **Tech Stack** | Google MediaPipe Tasks Vision |

## 1. Objective
Integrate the **MediaPipe Face Landmarker**.
We need to process the video frames coming from CameraX (`ImageProxy`), convert them to a format MediaPipe understands, and extract the **468 3D face landmarks**.

## 2. Technical Specifications

### 2.1 Dependencies
* Add to `libs.versions.toml`:
    * `com.google.mediapipe:tasks-vision:0.10.14` (or latest).

### 2.2 The Analyzer (`FaceLandmarkerHelper`)
We need a helper class that encapsulates the MediaPipe complexity.
* **Initialization:** Load the `.task` model file (downloaded to `assets/`).
* **Config:**
    * `runningMode`: LIVE_STREAM.
    * `numFaces`: 1.
    * `minDetectionConfidence`: 0.5.
* **Function:** `detectLiveStream(imageProxy: ImageProxy, isFrontCamera: Boolean)`
    * Convert `ImageProxy` -> `MPImage`.
    * Handle rotation (critical for mobile).
    * Call `faceLandmarker.detectAsync`.
    * Close the `imageProxy` (Crucial to prevent memory leaks).

### 2.3 CameraX Integration
* Modify `CameraPreview.kt` (created in Sprint 1).
* Add an `ImageAnalysis` use case to the `ProcessCameraProvider`.
* Bind the `FaceLandmarkerHelper` as the analyzer.

## 3. Implementation Steps (Agent Instructions)

1.  **Assets:**
    * Download the `face_landmarker.task` model from Google MediaPipe documentation.
    * Place it in `apps/mobile/src/main/assets/`.

2.  **Helper Class:**
    * Create `core/cv/FaceLandmarkerHelper.kt`.
    * Implement the setup and detection logic.
    * Define a callback/listener interface: `FaceLandmarkerListener` containing `onError` and `onResults`.

3.  **Wiring:**
    * Update `CameraPreview` to accept the `FaceLandmarkerHelper`.
    * In the `bindToLifecycle` scope, attach the `ImageAnalysis` use case.

4.  **Verification:**
    * Log the result: `Log.d("MediaPipe", "Nose Tip: ${result.faceLandmarks()[0].get(1)}")`.

---

## 4. Acceptance Criteria

* **[ ] Compilation:** Project builds with MediaPipe libraries.
* **[ ] Model Load:** App does not crash on startup (Model found in assets).
* **[ ] Data Flow:** Watching Logcat shows a stream of coordinate updates when the camera is active.
* **[ ] Performance:** The camera preview remains smooth (30fps), implying the analysis is running efficiently on a background thread.
