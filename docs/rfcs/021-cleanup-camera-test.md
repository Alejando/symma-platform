# RFC-021: Remove Temporary Camera Test Code

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Scope** | Mobile (`presentation/home`, `presentation/navigation`) |
| **Goal** | Remove the temporary debug button and route used to test the camera infrastructure in Sprint 1. |

## 1. Objective
Now that the Camera is fully integrated into the `PlayerScreen` (RFC-018), the standalone "Test Camera" button on the Home Screen and its associated route are no longer needed. We must remove them to maintain a production-ready codebase.

## 2. Changes Required

### 2.1 Home Screen (`HomeScreen.kt`)
* **Action:** Remove the "Test Camera" button (and any `Spacer` around it).
* **Verify:** The "Start Therapy" button (created/styled in RFC-020) should be the primary and only major action.

### 2.2 Navigation (`AppNavigation.kt` or `MainActivity.kt`)
* **Action:** Remove the composable route definition for `"camera_test"` (or whatever slug was used).
* **Action:** If a specific `CameraTestScreen.kt` file was created solely for this test, delete the file.

### 2.3 Cleanup
* **Action:** Check imports. Remove any unused imports related to the deleted route.

## 3. Acceptance Criteria
* **[ ] Clean UI:** The Home Screen no longer shows debug buttons.
* **[ ] Clean Code:** No dead routes in the Navigation Graph.
* **[ ] Functionality:** The real "Start Therapy" flow still works perfectly.