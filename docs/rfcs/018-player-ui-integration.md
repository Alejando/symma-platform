# RFC-018: Exercise Player UI Integration (MOB-6 Final)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-6 Part 1 (Camera), MOB-6 Part 2 (Logic) |
| **Scope** | Mobile (`presentation/player/PlayerScreen.kt`) |
| **Goal** | Combine the Camera Feed and the State Machine into the final User Interface. |

## 1. Objective
Build the "Heads-Up Display" (HUD) for the patient.
The user must see their face (Camera) while receiving clear instructions (UI Overlay) driven by the ViewModel state.

## 2. UI Specifications (Jetpack Compose)

### 2.1 Layout Strategy
Use a `Box` container to layer elements:
* **Layer 0 (Background):** `CameraPreview` (Created in RFC-016). Fills `MaxSize`.
* **Layer 1 (Scrim):** A Gradient (Transparent -> Black) at the bottom to make text readable.
* **Layer 2 (Overlay):** The HUD components anchored to the bottom.

### 2.2 The "HUD" (Heads-Up Display) Components
The UI changes based on `PlayerUiState`:

* **A. Header (Top):**
    * Simple "Close" (X) button (Top Left).
    * "Exercise X of Y" pill (Top Center).

* **B. State: `GetReady` (Countdown)**
    * **Center Screen:** Large Text "Get Ready: 5".
    * **Visual:** Large Circular Progress Indicator (Green).

* **C. State: `Exercise` (Action)**
    * **Bottom Sheet Area:**
        * **Title:** Exercise Name (e.g., "Raise Eyebrows").
        * **Metric:** Huge Timer or Rep Counter (e.g., "HOLD: 3s").
        * **Sub-metric:** "Rep 2/10".
        * **Controls:** Pause/Resume Button.

* **D. State: `Rest` (Recovery)**
    * **Color Theme:** Orange/Amber.
    * **Text:** "Relax... Next: [Next Exercise Name]".
    * **Metric:** "Rest: 15s".
    * **Action:** "Skip Rest" button.

### 2.3 Navigation Logic
* Observe `viewModel.uiState`.
* **IF State == Completed:** Navigate to `Screen.SessionSummary` (We will build this screen next, for now just pop back or show a Toast).

## 3. Implementation Steps (Agent Instructions)

1.  **Component Assembly:**
    * Create `PlayerOverlay.kt`. Isolate the text/buttons logic here to keep the main screen clean.
    * Use `AnimatedContent` (optional) to smooth transitions between "Exercise" and "Rest" text.

2.  **Main Screen Integration (`PlayerScreen.kt`):**
    * Inject `PlayerViewModel`.
    * Render `CameraPreview` (Layer 0).
    * Render `PlayerOverlay` (Layer 2), passing the current `state`.
    * Connect Buttons (Pause, Skip) to `viewModel.pause()`, `viewModel.skip()`.

3.  **Keep Screen On:**
    * **Critical UX:** The phone must NOT sleep during therapy.
    * Use `DisposableEffect` to set `window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)`.

---

## 4. Acceptance Criteria

* **[ ] Visual Hierarchy:** Camera is visible behind the text. Text is readable (contrast).
* **[ ] Dynamic UI:** The UI switches from "Get Ready" -> "Exercise" -> "Rest" automatically (driven by the ViewModel logic we tested).
* **[ ] Interaction:** Pause button stops the timer (and UI updates). "Skip Rest" jumps to the next exercise.
* **[ ] Stability:** Screen stays ON during the entire session.