# RFC-002: Authentication System (JWT + NextAuth + UI Mockups)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-001 (Completed) |
| **Scope** | Backend API, Web App (Next.js), Database |
| **UI Reference** | `docs/mockups/` |

## 1. Objective
Implement a secure authentication flow for **Therapists**.
1.  **Backend:** Create an Auth Module (JWT Strategy).
2.  **Web:** Integrate **NextAuth.js** and build the UI based on provided mockups.
3.  **Database:** Seed the database with an initial Admin.

## 2. Technical Specifications

### 2.1 Database & Seeding
* **Schema:** `Therapist` model with `email` and `passwordHash`.
* **Seeding:** Create `packages/database/prisma/seed.ts` to insert:
    * User: `admin@symma.com`
    * Password: `admin123` (Hashed via bcrypt).

### 2.2 Backend API (NestJS)
* **Port:** 4001.
* **Endpoints:**
    * `POST /api/v1/auth/login` (Returns access_token).
    * `GET /api/v1/auth/profile` (Protected via Guard).

### 2.3 Web Frontend (Next.js)
* **Port:** 4000.
* **Library:** `next-auth` (v5).
* **UI Implementation (CRITICAL):**
    * **Login Page (`/login`):** You MUST base the design and code structure on the files located in:
        * `docs/mockups/therapist_login/login_mockup.png` (Visual reference)
        * `docs/mockups/therapist_login/code_example.tsx` (Use this code as the base component).
    * **Dashboard Layout (`/dashboard`):** Base the layout on:
        * `docs/mockups/therapist_dashboard_overview/`
* **Logic:** Use `CredentialsProvider` to fetch the API at port 4001.

---

## 3. Implementation Steps (Agent Instructions)

The agent must execute these steps sequentially:

1.  **Install Dependencies:**
    * API: `passport`, `jwt`, `bcrypt`.
    * Web: `next-auth`.

2.  **Database Seeding:**
    * Create and run the seed script. Verify the user exists in DB.

3.  **Backend Implementation:**
    * Implement `AuthService` (validate & login) and `JwtStrategy`.
    * Expose the API endpoints.

4.  **Frontend Implementation (UI Focus):**
    * **Step A:** Read the file `docs/mockups/therapist_login/code_example.tsx`. Copy its logic/structure and adapt it to use the `signIn` function from NextAuth.
    * **Step B:** Configure `auth.ts` to talk to the Backend.
    * **Step C:** Create the Dashboard protection layer (Middleware).

---

## 4. Acceptance Criteria (Verification Tests)

* **[ ] Check 1: Database Seed**
    * `admin@symma.com` exists with hashed password.
* **[ ] Check 2: API Login**
    * `curl` to port 4001 returns a valid token.
* **[ ] Check 3: UI Match**
    * The `/login` page looks like the provided mockup and uses the provided example code.
* **[ ] Check 4: Full Flow**
    * Login at port 4000 redirects to `/dashboard` successfully.