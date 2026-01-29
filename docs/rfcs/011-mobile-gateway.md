# RFC-011: Mobile API Gateway & Swagger Documentation

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-009 (Access Hash), RFC-004 (Routines) |
| **Scope** | Backend API (Auth + Data Fetching), Documentation |
| **Goal** | Expose the endpoints required for the Patient's Mobile App to function. |

## 1. Objective
Prepare the Backend to serve the Mobile Application.
1.  **Documentation:** Enable Swagger to auto-generate API docs (crucial for Mobile development).
2.  **Auth:** Implement the Login flow using the `Patient ID` + `Access PIN` (created in RFC-009).
3.  **Sync:** Create a specialized endpoint that returns the **entire** active routine configuration in one request (Offline-first strategy).

## 2. Technical Specifications

### 2.1 API Documentation (OpenAPI/Swagger)
* **Library:** `@nestjs/swagger`.
* **Path:** `/api/docs`.
* **Requirement:** All DTOs (Auth, Routine) must use `@ApiProperty()` decorators so the schema is visible.

### 2.2 Patient Authentication (Mobile Login)
* **Endpoint:** `POST /api/auth/patient/login`
* **Body:** `{ patientId: string, accessCode: string }`.
* **Logic:**
    1.  Find patient by ID.
    2.  Compare `accessCode` vs `patient.access_code_hash` using `bcrypt`.
    3.  **Return:** A long-lived **JWT Token**.

### 2.3 Mobile Data Fetching (The "Big Payload")
* **Endpoint:** `GET /api/mobile/routine/active`
* **Auth:** Protected by `PatientJwtStrategy` (New strategy).
* **Response:** Optimized JSON for offline use. Must include:
    * Routine Details (Title, Dates).
    * **Nested Items:** Exercise Name, Media URLs (Video/Animation), Config (Reps, Sets, Rest Time).
* **Logic:** Fetch the *latest* active routine for the logged-in patient.

---

## 3. Implementation Steps (Agent Instructions)

1.  **Documentation First:**
    * Install `@nestjs/swagger`.
    * Configure `DocumentBuilder` in `main.ts`.
    * Annotate the `LoginDto` to ensure it shows up in docs.

2.  **Auth Implementation:**
    * Create `PatientAuthService`.
    * Implement the PIN validation logic.
    * Create the JWT Strategy specifically for Patients.

3.  **Mobile Controller:**
    * Create `MobileController`.
    * Implement `GET /active`. Ensure it uses `include: { items: { include: { exercise: true } } }` in Prisma to get the deep data structure.

---

## 4. Acceptance Criteria

* **[ ] Swagger UI:** Navigating to `http://localhost:4001/api/docs` loads the interactive API website.
* **[ ] Login Success:** Sending the correct PIN (generated in RFC-009) returns a JWT Token.
* **[ ] Login Fail:** Sending a wrong PIN returns 401 Unauthorized.
* **[ ] Data Sync:** Using the Patient Token, `GET /mobile/routine/active` returns the full JSON with exercises and media URLs.