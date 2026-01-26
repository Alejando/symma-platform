# RFC-010: Therapist Home Dashboard & Actionable Insights

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | RFC-003 (Patients), RFC-006 (Sessions), RFC-007 (Exercises) |
| **Scope** | Backend (Data Aggregation), Web (Dashboard UI) |
| **Visual Ref** | `image_bb88b0.png` (Strict Layout Adherence) |

## 1. Objective
Transform the Dashboard from a static placeholder into a **Live Command Center**.
The Goal is to provide "Actionable Intelligence":
1.  **KPIs:** Instant visibility into clinic volume and therapy efficacy.
2.  **Alerts:** Identify patients who are failing to comply (Risk of abandonment).
3.  **Navigation:** Shortcuts to key features built in previous RFCs.

## 2. Technical Specifications

### 2.1 Backend API (NestJS)
* **Endpoint:** `GET /dashboard/stats`
* **Response Payload:**
    ```json
    {
      "metrics": {
          "activePatients": { "value": 42, "trend": 5 }, // Count active patients
          "complianceAlerts": { "value": 3, "trend": -1 }, // Patients inactive > 72h
          "avgEfficacy": { "value": 88, "trend": 2 } // Avg Symmetry Score (last 7 days)
      },
      "atRiskPatients": [
          // List of patients triggering the Compliance Alert
          { "id": "uuid", "name": "Juan Perez", "daysInactive": 4, "avatarUrl": "..." }
      ]
    }
    ```
* **Business Logic:**
    * **Compliance Alert:** A patient is "At Risk" if they have an *Active Routine* (`endDate > now`) BUT have **0 Sessions** in the last **3 Days**.
    * **Efficacy:** Average the `symmetry_score` of all `SessionResults` from the past week.

### 2.2 Web Frontend (Next.js)
* **Layout Strategy:** Follow the provided **Visual Ref** (`image_bb88b0.png`).
* **Section A: KPIs (Top Row)**
    * Render the 3 cards.
    * **Logic:** If `complianceAlerts.value > 0`, style the text/icon in **Red** to demand attention.
* **Section B: Quick Actions (Middle Row)**
    * **Constraint:** The mockup shows "Schedule" and "Log Vitals". We do NOT have these features.
    * **Action:** Replace them with functional links:

| Mockup Button | New Functionality | Target URL |
| :--- | :--- | :--- |
| **Add Patient** | **Add Patient** (Same) | Opens Modal (RFC-003) |
| **Schedule** | **Exercises Library** | `/dashboard/exercises` (RFC-007) |
| **Log Vitals** | **Active Routines** | `/dashboard/patients?filter=active` |
| **Message** | **Generate Mobile PIN** | Opens Access Modal (RFC-009) |

* **Section C: Priority Attention (New Bottom Section)**
    * **Component:** A clean list or table below the Quick Actions.
    * **Content:** Render the `atRiskPatients` array.
    * **Action:** Clicking a row navigates to `/dashboard/patients/[id]`.
    * **Empty State:** "🎉 All active patients are compliant."

---

## 3. Implementation Steps (Agent Instructions)

1.  **Backend Implementation:**
    * Create `DashboardService` and `DashboardController`.
    * Implement the database queries using `Promise.all` for performance.
    * **Crucial:** Ensure the "At Risk" query correctly filters by *Active Routine* AND *Last Session Date*.

2.  **Frontend Components:**
    * Create `DashboardKPIs.tsx` (Reuse the Card designs).
    * Create `DashboardActions.tsx` (Implement the button mapping).
    * Create `RiskList.tsx` (The new priority widget).
    * Implement **Skeleton Loaders** for all sections to prevent layout shift.

3.  **Integration:**
    * Fetch data on page mount.
    * Handle the "Empty State" for the Risk List gracefully.

---

## 4. Acceptance Criteria

* **[ ] Visual Fidelity:** The page looks like `image_bb88b0.png`, respecting fonts, padding, and shadow styles.
* **[ ] Data Accuracy:**
    * Create a new patient -> "Active Patients" goes up.
    * Seed 4 days of inactivity for a patient -> "Compliance Alerts" goes up.
* **[ ] Navigation:** Clicking "Exercises Library" (formerly Schedule) correctly goes to the Catalog.
* **[ ] Alert Logic:** The "At Risk" list only shows patients who actually have an active routine (ignores archived patients).