# RFC-014: Patient Login Feature (UI + Integration)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-2 (Networking), RFC-011 (Backend API) |
| **Scope** | Mobile (`presentation/auth`, `domain/auth`) |
| **Key Components** | Jetpack Compose, ViewModel, EncryptedSharedPreferences |

## 1. Objective
Implement the "Access Code" Login flow.
Patients will enter a 6-digit PIN provided by the Therapist.
Upon success, the app must store the Session Token securely and navigate to the Home Screen.

## 2. UI Specifications (Jetpack Compose)

### 2.1 Layout Structure
* **Header:** App Logo (Centered, Top 20%).
* **Status Area:** Text "Welcome, [Patient Name]" (Only if cached) or "Enter your Access Code".
* **PIN Indicators:** A row of **6 Circles**.
    * *Empty:* Gray border.
    * *Filled:* Solid Teal color.
* **Keypad:** A large, accessible numeric grid (1-9, 0 at bottom).
    * *Style:* Large circular touch targets. No border, just clear numbers.
    * *Feedback:* Subtle ripple effect on tap.

### 2.2 UX Interactions
* **Input:** Tapping numbers fills the indicators left-to-right.
* **Deletion:** A "Backspace" icon to the right of '0'.
* **Auto-Submit:** When the 6th digit is entered, the app **automatically** triggers the API call. No "Login" button needed.
* **Loading State:** While validating, show a `CircularProgressIndicator` overlay.
* **Error State:** If API returns 401, shake the indicators (animation) and clear the input.

## 3. Technical Specifications

### 3.1 ViewModel (`AuthViewModel`)
* **State:** `loginState` (Idle, Loading, Success, Error).
* **Input:** `pin: String`.
* **Logic:**
    * Function `onPinDigitEntered(digit)`: Appends digit. Checks if length == 6.
    * If length == 6 -> Call `authRepository.login(pin)`.

### 3.2 Secure Storage
* **Requirement:** Never store the JWT in plain text.
* **Implementation:** Use `EncryptedSharedPreferences` (part of Jetpack Security Crypto).
* **Key:** `auth_token`.

### 3.3 Navigation
* Define the Navigation Graph in `MainActivity` or `AppNavigation.kt`.
* Routes: `"login"` -> `"home"`.
* **Logic:** On `Success` state, clear backstack (user cannot go back to login) and navigate to `"home"`.

---

## 4. Implementation Steps (Agent Instructions)

1.  **Dependency Check:** Ensure `androidx.security:security-crypto` is in `libs.versions.toml`. If not, add it.
2.  **UI Components:**
    * Create `PinIndicator.kt` (The dots).
    * Create `NumericKeypad.kt` (The buttons).
    * Assemble in `LoginScreen.kt`.
3.  **Logic & Integration:**
    * Implement `AuthViewModel`.
    * Inject `AuthRepository` (created in MOB-2).
    * Handle the API response.
4.  **Storage:**
    * Create a `TokenManager` class that wraps `EncryptedSharedPreferences`.
    * Save the token on success.

---

## 5. Acceptance Criteria

* **[ ] Visual:** The screen looks clean with Logo, 6 dots, and big keypad.
* **[ ] Interaction:** Typing fills dots. Backspace removes them.
* **[ ] Success Flow:** Entering the correct PIN (from DB) redirects to Home.
* **[ ] Persistence:** Restarting the app keeps the user logged in (Token is saved).
* **[ ] Error Handling:** Entering a wrong PIN shows a "Invalid Code" message (Snackbar or Text).