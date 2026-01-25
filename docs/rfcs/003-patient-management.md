# RFC-003: Patient Management Module (CRUD & Soft Delete)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-001 (Infra), RFC-002 (Auth) |
| **Scope** | API (NestJS), Web (Next.js), Database (Prisma) |
| **Design Ref** | [Patient List UI](https://stitch.withgoogle.com/preview/9466613625641761347?node-id=227eb221504643de9d1c02e594a16793) |

## 1. Objective
Implement the Core Functionality for Therapists: **Patient Management**.
Enable Therapists to Create, List, View, and "Soft Delete" (Archive) their patients.
Ensure strict data isolation: A therapist can ONLY see patients assigned to them.

## 2. Technical Specifications

### 2.1 Database (Prisma)
* **Model:** `Patient`.
* **Update:** Ensure `PatientStatus` enum includes `ARCHIVED`.
* **Avatar Logic:** No DB change needed. We will handle "No Avatar" on the Frontend (Initials).

### 2.2 Backend API (NestJS)
* **Module:** `PatientsModule`.
* **Guard:** All endpoints must be protected by `JwtAuthGuard`.
* **Logic:** Use `req.user.id` to enforce ownership. (e.g., `where: { therapistId: user.id }`).
* **Endpoints:**
    * `POST /patients`: Create new patient.
        * **Validation:** `email` is **Mandatory**. `diagnosis` is Free Text.
    * `GET /patients`: List all ACTIVE (non-archived) patients for the logged therapist.
    * `GET /patients/:id`: Get details.
    * `DELETE /patients/:id`: **Soft Delete**. Update status to `ARCHIVED`. Do NOT remove row.

### 2.3 Web Frontend (Next.js)
* **Route:** `/dashboard/patients`.
* **UI Components (Shadcn):**
    * `Table`: To display the list.
    * `Avatar`: Use `<AvatarFallback>` to show initials (e.g., "Juan Perez" -> "JP") if `avatar_url` is null.
    * `Dialog / Sheet`: For the "Add Patient" form.
* **Form Validation (Zod):**
    * Email: Required (Therapist must provide one if patient lacks it).
    * Name, Last Name: Required.
    * Diagnosis: Optional/Text.
* **Design Reference:**
    * Inspect the structure in the provided Design Link. Use it as a layout guide (Sidebar, Header, Table layout).

---

## 3. Implementation Steps (Agent Instructions)

The agent must execute these steps sequentially:

1.  **Database Update:**
    * Check `packages/database/schema.prisma`. Ensure `enum PatientStatus { ACTIVE, INACTIVE, ARCHIVED }`.
    * Run `pnpm db:push` if changes were made.

2.  **Backend Implementation:**
    * Generate `PatientsModule`, `PatientsController`, `PatientsService`.
    * Implement **DTOs** (`CreatePatientDto`) enforcing:
        * `firstName` (string)
        * `lastName` (string)
        * `email` (email)
        * `diagnosis` (string, optional)
    * Implement the Service logic using `prisma.patient`. **CRITICAL:** Always include `where: { therapistId }` in queries.

3.  **Frontend Implementation:**

    * **Type Safety:** Create a `Patient` interface in `packages/shared-types` matching the DTO.
    * **Page:** Create `/app/dashboard/patients/page.tsx`.
    * **Table:** Implement a responsive table listing patients. Columns: Avatar+Name, Email, Status, Actions.
    * **Add Button:** Opens a Modal/Dialog with the Create Form.
    * **Delete Action:** A button that calls `DELETE` endpoint and refreshes the list.
    * **Avatar:** Implement logic: `const initials = name.split(' ').map(n => n[0]).join('').substring(0,2)`.
    * **Route:** `/dashboard/patients`.
    * **Forms:**
        * **Source of Truth:** The form inputs must match the `Patient` model in Prisma, NOT just the fields shown in the mockup.
        * **Fields Required:** Name, Last Name, DOB, Phone, Diagnosis, Paralysis Degree, Emergency Contact.
    * **Functionality:**
        * **Create/Edit:** Use a Sheet or Dialog component.
        * **List:** Table with Avatar (Initials fallback).
        * **Delete:** Soft delete via API.

---

## 4. Acceptance Criteria (Verification Tests)

* **[ ] Check 1: Data Isolation**
    * Action: Log in as Therapist A, create a patient. Log in as Therapist B.
    * *Success:* Therapist B sees an empty list.
* **[ ] Check 2: Mandatory Email**
    * Action: Try to create a patient without email via API or Form.
    * *Success:* Fails with Bad Request / Validation Error.
* **[ ] Check 3: Soft Delete**
    * Action: Click "Delete" on a patient. Check Database.
    * *Success:* The record still exists, but `status` is `ARCHIVED`. The patient disappears from the frontend list.
* **[ ] Check 4: Avatar Fallback**
    * Action: Create patient "Maria Lopez" (no image).
    * *Success:* UI shows a circle with text "ML".