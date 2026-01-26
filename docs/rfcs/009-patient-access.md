# RFC-009: Patient Access Management (Therapist UI)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-005 (Patient Profile) |
| **Scope** | Database (New Field), Backend (Generate Logic), Web (UI Card) |
| **Goal** | Enable Therapist to generate a 6-digit PIN for the patient to log in to the mobile app. |

## 1. Objective
Patients cannot sign up themselves; they are elderly or have limitations.
The Therapist must generate a **6-digit Access PIN** and give it to the patient.
We need a UI in the Patient Profile to "Generate New PIN" and display it securely.

## 2. Technical Specifications

### 2.1 Database Schema (Prisma)
* **Model:** `Patient`
* **New Field:** `access_code_hash` (String, Optional).
    * *Security Note:* We store the HASH, not the raw PIN.
    * We DO NOT store the raw PIN. When generated, it is sent to the UI *once* and then lost from the server (standard security practice).

### 2.2 Backend API (NestJS)
* **Endpoint:** `POST /patients/:id/access-code`
* **Logic:**
    1.  Generate a random 6-digit string (e.g., "849201").
    2.  Hash it using `bcrypt`.
    3.  Update the patient record with the hash.
    4.  **Return:** The **RAW** PIN (so the frontend can show it).

* **Endpoint:** `DELETE /patients/:id/access-code`
* **Logic:** Set `access_code_hash` to NULL. (Revokes access).

### 2.3 Web Frontend (Next.js)
* **Location:** `/dashboard/patients/[id]/page.tsx` (Overview Tab).
* **Component:** `PatientAccessCard`.
* **States:**
    * **No Access:** Show button "Generate Mobile PIN".
    * **Active:** Show "Access Active" badge + "Revoke" button + "Regenerate" button.
* **Interaction:**
    * When "Generate" is clicked -> Call API.
    * Show a **Dialog/Modal** with the PIN in large text: *"Share this code with the patient: 849-201"*.
    * Warning: *"This code will not be shown again."*

---

## 3. Implementation Steps (Agent Instructions)

1.  **Database:**
    * Add `access_code_hash` to `Patient` model in schema.
    * Run `pnpm db:push`.

2.  **Backend:**
    * Implement `PatientsController.generateAccessCode(id)`.
    * Ensure it returns `{ accessCode: '123456' }`.

3.  **Frontend:**
    * Create `PatientAccessCard` component.
    * Add it to the Patient Profile Overview.
    * Implement the Alert Dialog to display the returned PIN.

---

## 4. Acceptance Criteria

* **[ ] Generation:** Clicking "Generate" updates the DB (hash exists) and shows the raw number in the UI.
* **[ ] Security:** Refreshing the page DOES NOT show the number again (API should not return it).
* **[ ] Revocation:** Clicking "Revoke" sets the hash to null.