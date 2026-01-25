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
│   ├── config/         # Shared ESLint/TSConfig
│   └── ui/             # (Optional) Shared React components
```

3\. Design System & UX Standards
--------------------------------

**Unified Brand Identity:**

*   **Font Family:** Inter (Google Fonts).
    
*   **Primary Color:** Teal 600 (**#0D9488**) - Represents clinical precision & calm.
    
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

*   **React Compiler:** Must be enabled in next.config.js (experimental: { reactCompiler: true }).
    
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
        
    *   **Output:** Metadata (Score) + 1 Snapshot Image (Best attempt).
        

5\. Data Model (Prisma Schema)
------------------------------

_All IDs must be UUIDs._

```
erDiagram
    %% --- GESTIÓN DE USUARIOS Y CLÍNICAS ---
    CLINIC ||--|{ THERAPIST : emplea
    THERAPIST ||--|{ PATIENT : atiende

    CLINIC {
        uuid id PK
        string name
        string address
        string contact_phone
        string billing_info
        timestamp created_at
    }

    THERAPIST {
        uuid id PK
        uuid clinic_id FK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role "ADMIN | THERAPIST"
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
        %% Seguridad Offline
        string auth_pin_hash "Hash del PIN para acceso local"
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    %% --- MOTOR DE REHABILITACIÓN (Configuración) ---
    PATIENT ||--|{ ROUTINE : tiene_asignada
    ROUTINE ||--|{ ROUTINE_ITEM : contiene
    EXERCISE_CATALOG ||--|{ ROUTINE_ITEM : base_de

    EXERCISE_CATALOG {
        uuid id PK
        string key_name UK "Clave i18n (ej: exercise_smile)"
        string type "AR_TRACKING | MANUAL | RELAXATION"
        string category "WARMUP | CORE | COOLDOWN"
        string asset_animation_url
        string asset_tutorial_video_url
        jsonb default_config "Config base: {threshold: 0.5, hold: 5}"
    }

    ROUTINE {
        uuid id PK
        uuid patient_id FK
        string name "Ej: Fase 1 - Movilidad"
        date start_date
        date end_date
        boolean is_active
        text therapist_notes
        timestamp created_at
    }

    ROUTINE_ITEM {
        uuid id PK
        uuid routine_id FK
        uuid exercise_id FK
        int order_index
        %% Configuración Específica para este Paciente
        int target_repetitions
        int target_sets
        int hold_time_seconds
        float success_threshold "0.0 - 1.0 (Sobrescribe el default)"
        int rest_between_sets_seconds
    }

    %% --- EJECUCIÓN Y RESULTADOS (Sincronización) ---
    PATIENT ||--|{ SESSION : realiza
    SESSION ||--|{ SESSION_RESULT : genera
    EXERCISE_CATALOG ||--|{ SESSION_RESULT : corresponde_a

    SESSION {
        uuid id PK
        uuid patient_id FK
        timestamp started_at
        timestamp ended_at
        %% Datos de Calibración
        jsonb calibration_vector "Datos crudos del rostro neutro"
        string calibration_snapshot_url
        %% Control de Sincronización
        boolean is_synced "False si se creó offline y aun no sube"
        timestamp synced_at
    }

    SESSION_RESULT {
        uuid id PK
        uuid session_id FK
        uuid exercise_id FK
        %% Métricas de Éxito
        boolean is_completed
        float max_score_achieved "Puntaje más alto (0.0 - 1.0)"
        float avg_symmetry_score "Promedio de la sesión"
        float hold_time_avg "Cuanto tiempo aguantó el gesto"
        int repetitions_completed
        %% Evidencia
        string evidence_snapshot_url "Foto del mejor momento"
        jsonb metadata "Cualquier dato extra técnico"
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

*   **LFPDPPP (Mexico):** All sensitive data transmission must be TLS 1.3.
    
*   **Permissions:** Mobile app must request Camera permission explaining the therapeutic necessity.
    
*   **Images:** Stored in S3-compatible storage, never directly in DB.