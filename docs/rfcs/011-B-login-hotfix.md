# RFC-011-B: HOTFIX - Access Code Login Strategy

| Metadata | Value |
| :--- | :--- |
| **Status** | **URGENT / APPROVED** |
| **Reason** | Previous design required 'patientId' which the Mobile App does not have. |
| **Scope** | Backend (`AuthService`), Database (`Patient` model) |

## 1. The Problem
The previous definition of `POST /auth/patient/login` required `{ patientId, accessCode }`.
However, the Mobile UX is designed for elderly patients to enter **ONLY a 6-digit PIN**.
The App has no way to know the `patientId` before logging in.

## 2. The Fix (Backend Logic)

### 2.1 Database Update (Prisma)
* **Constraint:** The Access Code must be used for **Lookups**.
* **Change:**
    * Ensure `access_code_hash` is **UNIQUE**.
    * *Technical Note:* Since we use hashes, we must use a **Deterministic Hash** (like SHA-256) instead of a Salted Hash (like Bcrypt) for this specific field, OR iterate (bad), OR store a "lookup key".
    * **Simpler MVP Approach:** Store the `access_code` directly but ensure the column is `@unique`.
    * *Security Trade-off:* For this MVP, storing the 6-digit PIN is acceptable if rate-limiting is applied.
    * **Decision:** Modify `Patient` model: `access_code String? @unique` (Plain text for MVP lookup or Deterministic Hash). Let's use **Deterministic Hash (SHA-256)** for privacy.

### 2.2 Endpoint Update
* **Endpoint:** `POST /api/auth/patient/login`
* **New Payload:** `{ accessCode: string }` (Removes `patientId`).
* **Logic:**
    1.  Hash the incoming `accessCode` (SHA-256).
    2.  Find patient: `db.patient.findUnique({ where: { access_code_hash: hashedCode } })`.
    3.  If found -> Return JWT.
    4.  If not found -> Return 401.

### 2.3 Generation Logic Update (RFC-009 Refactor)
* When the Therapist generates a code:
    1.  Generate random 6-digits.
    2.  Check DB for collisions. If exists, regenerate.
    3.  Save the **Hash** to DB.
    4.  Return Raw to Therapist.

## 3. Instructions for Agent

1.  **Refactor Schema:** Update `access_code_hash` to be `@unique`.
2.  **Refactor Auth Service:**
    * Change login method to find user by `access_code_hash`.
    * Remove `patientId` from the DTO.
3.  **Refactor Generator:** Ensure generated codes do not collide with existing hashes.
