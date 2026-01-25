# RFC-005: Patient Profile Hub & Sidebar Cleanup

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-003 (Patients), RFC-004 (Routine Builder) |
| **Scope** | Web Frontend (Layouts, Routing), Sidebar Cleanup |
| **Design Ref** | [https://stitch.withgoogle.com/preview/9466613625641761347?node-id=085c856162f349779339495809a4b637] |

## 1. Objective
Currently, we lack a dedicated "Patient Profile" view.
We need to:
1.  **Refactor Sidebar:** Remove any global "Routines" link. Access must be hierarchical (`Patients -> [Select ID] -> Routines`).
2.  **Create Profile Layout:** Implement `/dashboard/patients/[id]` with navigation tabs based on the **Design Ref**.
3.  **Implement Routines List:** A specific tab showing Active vs. History routines.

## 2. Technical Specifications

### 2.1 Navigation & Cleanup
* **Action:** Open `apps/web/config/nav.ts`.
* **Instruction:** **DELETE** the "Routines" item from the main menu. Routines are patient-specific.

### 2.2 Profile Layout (Next.js)
* **File:** `apps/web/app/dashboard/patients/[id]/layout.tsx`.
* **Visual Reference:** Check the **Design Ref** link strictly for the Header and Tabs style.
* **Features:**
    * **Header:** Patient Name, Avatar (Initials), Age/Gender.
    * **Tabs:** Use Shadcn Tabs: `Overview` (Default), `Routines`.

### 2.3 Routines Tab Implementation
* **Location:** `apps/web/app/dashboard/patients/[id]/routines/page.tsx`.
* **Logic:**
    * Fetch routines for `params.id`.
    * **Active Routine:** Display as a highlighted Card (Green border/badge).
    * **History:** Display as a Table (Name, Date Range, Status).
    * **"Assign New" Button:** Must link to `/dashboard/patients/${params.id}/routines/new` (The form built in RFC-004).

---

## 3. Implementation Steps (Agent Instructions)

1.  **Sidebar Cleanup:** Remove the global "Routines" link immediately.
2.  **Profile Header:** Create the common layout matching the Mockup.
3.  **Tabs Integration:** Implement the sub-navigation.
4.  **Routines List:** Connect the backend `GET /patients/:id/routines` to the UI.

---

## 4. Acceptance Criteria

* **[ ] Check 1: Design Fidelity**
    * The Header and Tabs look like the provided **Design Ref**.
* **[ ] Check 2: Navigation Hierarchy**
    * "Routines" does NOT appear in the left sidebar.
* **[ ] Check 3: Integration**
    * Clicking "Assign New" correctly opens the RFC-004 builder with the patient context.