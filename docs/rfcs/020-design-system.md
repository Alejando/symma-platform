# RFC-020: Symma Design System & Accessibility Overhaul

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | Sprint 1 Completion |
| **Scope** | Mobile (`ui/theme`, `presentation/components`) |
| **Goal** | Establish a consistent, accessible UI language (Typography, Colors, Components) and refactor existing screens to use it. |

## 1. Objective
Replace hardcoded styles with a centralized **Design System**.
Ensure the app meets **WCAG AA** standards for contrast and touch target sizes (min 48dp), specifically tailored for elderly users.

## 2. Design Specifications

### 2.1 Color Palette (Medical & Calming)
* **Primary:** `Teal 600` (#0D9488) - Actions, Success.
* **Secondary:** `Slate 800` (#1E293B) - Text, Headings.
* **Surface/Background:** `Slate 50` (#F8FAFC) - Clean, not pure white (reduces eye strain).
* **Error/Destructive:** `Rose 600` (#E11D48) - Stop, Cancel.
* **Warning:** `Amber 500` (#F59E0B) - Rest periods.

### 2.2 Typography (Readable)
* **Font Family:** Sans-serif (System default or Inter).
* **Scale:**
    * `Display`: 32sp (Short stats).
    * `Heading`: 24sp (Page titles).
    * `BodyLarge`: 18sp (Instructions - Critical for readability).
    * `Button`: 16sp (Uppercased, Bold).

### 2.3 Core Components (The "Lego" Blocks)
1.  **`SymmaButton`:**
    * Height: 56dp (Large touch target).
    * Style: Rounded Corners (12dp).
    * Variants: `Primary` (Filled), `Secondary` (Outlined).
2.  **`SymmaCard`:**
    * Background: White.
    * Elevation: Low (2dp).
    * Padding: 16dp.
    * Corner Radius: 16dp.
3.  **`SymmaScaffold`:**
    * Standard wrapper for all screens with consistent Padding and StatusBar handling.

## 3. Implementation Steps (Agent Instructions)

1.  **Theme Definition:**
    * Update `Theme.kt` (Material3).
    * Define `Color.kt` and `Type.kt` with the specs above.

2.  **Component Creation:**
    * Create `components/design/SymmaButton.kt`.
    * Create `components/design/SymmaCard.kt`.

3.  **Refactor Screens (Apply the Polish):**
    * **Login Screen:** Use `SymmaScaffold` and `SymmaButton`. Ensure the Keypad is huge and high-contrast.
    * **Home Screen:** Wrap the routine in a `SymmaCard`. Make the "Start" button full-width.
    * **Player Overlay:** Ensure text has a shadow or scrim so it's readable over the camera.
    * **Summary Screen:** Use the `Display` font for the "Success" message.

---

## 4. Acceptance Criteria

* **[ ] Consistency:** No hardcoded colors (e.g., `Color.Blue`) in specific screens. All must use `MaterialTheme.colorScheme`.
* **[ ] Accessibility:** All interactive buttons are at least 48dp height. Text is high contrast.
* **[ ] Dark Mode:** The app looks decent in Dark Mode (Material3 handles this mostly automatically if tokens are used correctly).