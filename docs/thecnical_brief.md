# 📘 Symma: Technical Engineering Brief

**Project:** Symma Platform (Facial Paralysis Rehabilitation Ecosystem)
**Version:** 2.0.0 (Production Architecture)
**Status:** Approved for Development (Sprint 0)
**Date:** January 2026
**Repository:** Monorepo (Turborepo + pnpm)

---

## 1. Executive Summary
**Symma** is a next-generation digital health platform designed to assist patients with facial paralysis. It replaces a legacy Beta version with a scalable, high-performance ecosystem.

The system is composed of:
1.  **Symma Web (Therapist Portal):** A Next.js dashboard for clinical management and data visualization.
2.  **Symma Mobile (Patient App):** An offline-first Android application using on-device Computer Vision (MediaPipe) for guided therapy.

---

## 2. High-Level Architecture & Stack

We utilize a **Monorepo** strategy to share types and configurations between Backend, Web, and Mobile.

### Core Stack
| Component | Technology | Specifics / Config |
| :--- | :--- | :--- |
| **Package Manager** | **pnpm** | Strict dependency management & workspace support. |
| **Orchestrator** | **Turborepo** | Build system for Monorepo. |
| **Backend API** | **NestJS** | REST API, Passport (JWT), Swagger. |
| **Database** | **PostgreSQL 15** | Dockerized. Managed via **Prisma ORM**. |
| **Web Frontend** | **Next.js 14+** | **App Router**, **React Compiler** (Enabled). |
| **Mobile App** | **Android (Kotlin)** | Jetpack Compose, Room DB, WorkManager, Hilt. |
| **Computer Vision** | **MediaPipe** | Face Landmarker (478 points). On-device processing. |
| **Infrastructure** | Docker Compose | Local development environment. |

### Monorepo Structure
```text
symma-platform/
├── apps/
│   ├── api/            # NestJS (Backend)
│   ├── web/            # Next.js (Therapist Dashboard)
│   └── mobile/         # Android Project (Kotlin/Gradle) - Co-located for type generation
├── packages/
│   ├── database/       # Prisma Schema & Client
│   ├── shared-types/   # TypeScript Interfaces (The Contract)
│   ├── i18n/           # Shared translation catalogs (es, en)
│   ├── eslint-config/  # Shared ESLint config
│   └── typescript-config/ # Shared TSConfig
```

3\. Design System & UX Standards
--------------------------------

**Unified Brand Identity:**

*   **Font Family:** Inter (Google Fonts).
    
*   **Primary Color:** Teal 700 (**#0F766E**) - Represents clinical precision & calm. Contrast 5.47:1 on white (WCAG AA). The original Teal 600 (#0D9488) only reaches 3.74:1 on white and must not be used for text.
    
*   **Secondary Color:** Rose 600 (**#E11D48**) - For alerts/correction needed.
    
*   **Base Color:** Slate (Cool Grey) - For text and backgrounds.
    

### UI Libraries Implementation

*   **Web (Next.js):**
    
    *   **Library:** **Shadcn/ui** (Base Color: Slate, CSS Variables: Yes).
        
    *   **Styling:** Tailwind CSS.
        
    *   **Icons:** Lucide React (Rounded).
        
*   **Mobile (Android):**
    
    *   **Library:** **Material Design 3 (M3)**.
        
    *   **Styling:** Jetpack Compose Theming.
        
    *   **Icons:** Material Symbols (Rounded).
        

4\. Key Technical Decisions
---------------------------

### A. Web Performance (Next.js)

*   **React Compiler:** Must be enabled in next.config.ts (`reactCompiler: true`).
    
*   **Rendering:** Use **Server Components** by default. Use "use client" only for interactive forms and Recharts visualizations.
    

### B. Mobile "Offline-First" Strategy

*   **Source of Truth:** Local **Room Database** (SQLite).
    
*   **Sync Logic:**
    
    1.  User performs exercises offline -> Data saved to Room.
        
    2.  WorkManager detects Network -> Batches pending sessions -> Sends to NestJS.
        
*   **Security:** Local DB encrypted via SQLCipher. Authentication via Biometrics/PIN when offline.
    

### C. Computer Vision Engine

*   **Tool:** MediaPipe Tasks Vision (FaceLandmarker).
    
*   **Privacy:** No video recording.
    
    *   **Input:** Live Camera Stream.
        
    *   **Processing:** Extract blendshapes (e.g., mouthSmileLeft) @ 30fps.
        
    *   **Output:** Metadata (gesture accuracy and left/right symmetry, both 0–100) + 1 Snapshot Image per exercise (Best attempt).
        

5\. Data Model (Prisma Schema)
------------------------------

_All IDs must be UUIDs. Session IDs are generated on the device and double as the idempotency key of `POST /sessions`. Source of truth: `packages/database/prisma/schema.prisma` (detailed in `docs/diagrama-er.md`)._

```
erDiagram
    %% --- USERS AND CLINICS ---
    CLINIC ||--|{ THERAPIST : emplea
    THERAPIST ||--|{ PATIENT : atiende

    CLINIC {
        uuid id PK
        string name
        timestamp created_at
    }

    THERAPIST {
        uuid id PK
        uuid clinic_id FK
        string email UK
        string password_hash "bcrypt"
        string first_name
        string last_name
        string role "ADMIN | THERAPIST (only ADMIN edits the exercise catalog)"
        boolean is_active
        timestamp created_at
    }

    PATIENT {
        uuid id PK
        uuid therapist_id FK
        string first_name
        string last_name
        date date_of_birth
        string gender "MALE | FEMALE | OTHER"
        string phone_number
        string email "Opcional"
        %% Datos Clínicos
        string status "ACTIVE | INACTIVE | ARCHIVED"
        string diagnosis
        int initial_paralysis_degree "1-6 (House-Brackmann)"
        text clinical_notes
        %% Contacto Emergencia
        string emergency_contact_name
        string emergency_contact_phone
        %% Acceso móvil
        string access_code_hash UK "HMAC-SHA256 of the 6-digit PIN (PIN_HMAC_SECRET)"
        timestamp created_at
        timestamp updated_at
    }

    %% --- MOTOR DE REHABILITACIÓN (Configuración) ---
    PATIENT ||--|{ ROUTINE : tiene_asignada
    ROUTINE ||--|{ ROUTINE_ITEM : contiene
    EXERCISE ||--|{ ROUTINE_ITEM : base_de

    EXERCISE {
        uuid id PK
        string key_name UK "Clave i18n (ej: exercise_smile)"
        string name
        string description
        string type "ISOTONIC | ISOMETRIC | MANUAL | RELAXATION"
        string category "WARMUP | CORE | COOLDOWN"
        string mobile_module "EYES | EYES_INVERSE | BROWS | JAW | SMILE | KISS"
        string asset_animation_url
        string asset_tutorial_video_url
        timestamp created_at
    }

    ROUTINE {
        uuid id PK
        uuid patient_id FK
        string name "Ej: Fase 1 - Movilidad"
        date start_date
        date end_date
        string status "DRAFT | ACTIVE | ARCHIVED (max. one ACTIVE per patient)"
        text therapist_notes
        timestamp created_at
        timestamp updated_at
    }

    ROUTINE_ITEM {
        uuid id PK
        uuid routine_id FK
        uuid exercise_id FK
        int order_index
        %% Configuración Específica para este Paciente
        int sets
        int reps_per_set
        int target_hold_seconds
        float difficulty_level "Multiplies the calibrated threshold"
        int rest_between_sets "seconds"
        boolean strict_mode
        boolean allow_skip
    }

    %% --- EJECUCIÓN Y RESULTADOS (Sincronización) ---
    ROUTINE ||--|{ SESSION : genera
    SESSION ||--|{ SESSION_ITEM : registra
    EXERCISE ||--|{ SESSION_ITEM : corresponde_a

    SESSION {
        uuid id PK "Generated on the device (idempotency key)"
        uuid routine_id FK
        timestamp date
        int duration_seconds
        float score "0-100"
        boolean is_synced
        jsonb calibration "Calibration used: {capturedAt, values}"
        timestamp created_at
    }

    SESSION_ITEM {
        uuid id PK
        uuid session_id FK
        uuid exercise_id FK
        int reps_completed
        float average_accuracy "Gesture accuracy vs. calibrated threshold (0-100)"
        float symmetry_score "Left/right symmetry (0-100)"
        float average_hold_seconds
        string snapshot_key "S3 key of the best-attempt snapshot"
        jsonb series_data "Detailed per-rep data"
    }
``` 


6\. Sprint 0: Immediate Action Items
------------------------------------

### 🏗 Infrastructure & Backend

*   **\[INF-01\] Repo Init:** Setup Turborepo with pnpm. Configure workspaces.
    
*   **\[INF-02\] Docker:** Setup docker-compose.yml for PostgreSQL.
    
*   **\[BE-01\] Database:** Create schema.prisma in packages/database and run initial migration.
    
*   **\[BE-02\] Auth:** Implement Therapist Login (JWT) in NestJS.
    

### 🖥 Web (Next.js)

*   **\[WEB-01\] Setup:** Initialize Next.js 14 + Tailwind.
    
*   **\[WEB-02\] Config:** Enable **React Compiler** in next.config.js.
    
*   **\[WEB-03\] UI Kit:** Initialize **Shadcn/ui** (Slate base). Customize globals.css with Symma Teal (#0D9488).
    
*   **\[WEB-04\] Patient Form:** Create "New Patient" screen with Zod validation.
    

### 📱 Mobile (Android)

*   **\[MOB-01\] Setup:** Initialize Android Studio project in apps/mobile. Configure Hilt & Compose.
    
*   **\[MOB-02\] Persistence:** Create Room Entities matching the Prisma Schema (Patient, Session).
    
*   **\[MOB-03\] POC:** Implement MediaPipe FaceMesh overlay on camera feed.
    

7\. Security & Compliance
-------------------------

*   **LFPDPPP (Mexico):** All sensitive data transmission must use TLS 1.2 or higher, with TLS 1.3 preferred (RNF-011).
    
*   **Permissions:** Mobile app must request Camera permission explaining the therapeutic necessity.
    
*   **Images:** Stored in S3-compatible storage (MinIO locally), never directly in DB. The database keeps only the object key; clients upload and read through short-lived signed URLs.