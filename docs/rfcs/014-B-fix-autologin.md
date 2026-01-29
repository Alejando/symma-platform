# RFC-014-Fix: Auto-Login & Navigation Logic

| Metadata | Value |
| :--- | :--- |
| **Status** | **HOTFIX / CRITICAL** |
| **Scope** | `presentation/MainActivity.kt`, `presentation/navigation` |
| **Goal** | Skip Login screen if a valid Token exists in storage. |

## 1. The Problem
The app currently forces the user to the "Login" screen on every launch, even if they have successfully logged in previously.
This breaks the Offline-First experience.

## 2. Technical Solution

### 2.1 Logic in `MainActivity`
Instead of a static start destination, we must calculate it during `onCreate`.

* **Dependency:** Inject `TokenManager` into `MainActivity`.
* **Check:** Read `tokenManager.getToken()`.
* **Decision:**
    * If `token != null` -> `startDestination = "home"`
    * If `token == null` -> `startDestination = "login"`

### 2.2 Navigation Setup
* Pass this calculated `startDestination` to the `NavHost` composable.

## 3. Implementation Steps (Agent Instructions)

1.  **Inject TokenManager:** Add `@Inject lateinit var tokenManager: TokenManager` to `MainActivity`.
2.  **Determine Route:**
    ```kotlin
    val startDestination = if (tokenManager.getToken() != null) Screen.Home.route else Screen.Login.route
    ```
3.  **Update NavHost:** Ensure the `NavHost` uses this variable instead of a hardcoded string.

## 4. Acceptance Criteria
* **[ ] Test 1:** Login once. Kill the App. Re-open. It should land on **Home** immediately.
* **[ ] Test 2:** Logout (clear token). Kill App. Re-open. It should land on **Login**.