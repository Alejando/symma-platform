# RFC-016: CameraX Infrastructure & Permissions (MOB-6 Part 1)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-1 (Project Setup) |
| **Scope** | Mobile (`presentation/components/camera`, `AndroidManifest`) |
| **Tech Stack** | CameraX (Camera2), Accompanist (Permissions) or ActivityResultLauncher |

## 1. Objective
Build the foundational **Camera Preview** component.
Before we can guide the patient through exercises, we must ensure:
1.  We have permission to use the Camera.
2.  We can render the **Front Camera** feed efficiently in Jetpack Compose.
3.  The lifecycle is handled correctly (Camera closes when app pauses).

## 2. Technical Specifications

### 2.1 Dependencies
Update `libs.versions.toml` to include AndroidX CameraX:
* `androidx.camera:camera-core`
* `androidx.camera:camera-camera2`
* `androidx.camera:camera-lifecycle`
* `androidx.camera:camera-view`

### 2.2 Permissions Logic
* **Manifest:** Add `<uses-permission android:name="android.permission.CAMERA" />`.
* **Flow:**
    * Check if permission is granted.
    * **If NOT:** Show a rationale screen: "We need the camera so you can see your facial movements." with a "Grant Permission" button.
    * **If GRANTED:** Show the Camera Preview.

### 2.3 `CameraPreview` Composable
* **Tech:** Requires `AndroidView` (Interop) to host the `PreviewView`.
* **Configuration:**
    * **Lens:** `CameraSelector.LENS_FACING_FRONT`.
    * **UseCase:** `Preview`.
    * **Lifecycle:** Bind to `LocalLifecycleOwner.current`.
* **Mirroring:** Ensure the front camera is MIRRORED (so left is left), otherwise patients get confused moving the wrong side of their face.

## 3. Implementation Steps (Agent Instructions)

1.  **Setup:**
    * Add CameraX dependencies to `build.gradle.kts`.
    * Add permission to `AndroidManifest.xml`.

2.  **Component Construction:**
    * Create `presentation/components/camera/CameraPreview.kt`.
    * Implement the `AndroidView` factory to initialize `ProcessCameraProvider`.
    * Bind the camera to the lifecycle.

3.  **Permission Wrapper:**
    * Create `presentation/components/camera/CameraPermissionWrapper.kt`.
    * Logic: If permission denied -> Render `RationaleContent`. If allowed -> Render `content()`.

4.  **Verification Page:**
    * Create a temporary route `"camera_test"` in Navigation.
    * Use the `CameraPermissionWrapper` wrapping the `CameraPreview`.
    * *Goal:* Open app -> Click a temp button -> Ask Permission -> See Selfie.

---

## 4. Acceptance Criteria

* **[ ] Build:** Compiles with CameraX libs.
* **[ ] Permission Flow:**
    * First launch: Android System Dialog asks for permission.
    * Deny: Shows Rationale UI (Text + Button).
    * Allow: Shows Camera immediately.
* **[ ] Visual:** The camera feed covers the screen (or allocated space).
* **[ ] UX:** The feed is the **Front Camera** and is **Mirrored** (acting like a mirror).
* **[ ] Lifecycle:** Minimizing the app releases the camera (green dot on Android status bar disappears).