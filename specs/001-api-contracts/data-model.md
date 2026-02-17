# Data Model: API Contracts — Single Source of Truth

**Branch**: `001-api-contracts` | **Date**: 2026-02-15

This document defines every contract type that will live in `packages/shared-types/src/`. Types are grouped by domain. The Prisma schema (`packages/database/prisma/schema.prisma`) remains the canonical storage model; these contracts describe the **JSON wire format** exchanged over HTTP.

## Conventions

- **Field names**: camelCase (JSON wire format)
- **Dates**: ISO 8601 UTC with `Z` suffix (`2026-02-15T21:00:00.000Z`) or `YYYY-MM-DD` for date-only
- **IDs**: UUID strings
- **Scores**: integer 0–100 (API converts from DB float 0–1)
- **Optionality**: `?` = may be absent; `| null` = present but nullable
- **Enums**: string unions matching Prisma enum values

---

## Enums (`enums.ts`)

```typescript
type Gender = 'MALE' | 'FEMALE' | 'OTHER';
type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
type Role = 'ADMIN' | 'THERAPIST';
type ExerciseType = 'ISOTONIC' | 'ISOMETRIC' | 'MANUAL' | 'RELAXATION';
type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';
type RoutineStatus = 'ACTIVE' | 'ARCHIVED';
type MobileModule = 'EYES' | 'EYES_INVERSE' | 'BROWS' | 'JAW' | 'SMILE' | 'KISS';
```

---

## Common (`common.ts`)

### PaginationQuery

```typescript
interface PaginationQuery {
  page?: number;   // 1-indexed, default 1
  limit?: number;  // default 20, max 100
  search?: string; // optional text search filter
}
```

### PaginatedResponse\<T\>

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;   // total matching records (not just this page)
  page: number;    // current page (1-indexed)
  limit: number;   // items per page
}
```

### ApiError

```typescript
interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

---

## Auth (`auth.ts`)

### LoginRequest

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

### LoginResponse

```typescript
interface LoginResponse {
  accessToken: string;  // NOTE: renamed from access_token (snake_case → camelCase)
}
```

### TherapistProfileResponse

```typescript
interface TherapistProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  clinicId: string;
}
```

### MobileLoginRequest

```typescript
interface MobileLoginRequest {
  accessCode: string;  // 6-digit PIN
}
```

### MobileLoginResponse

```typescript
interface MobileLoginResponse {
  accessToken: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

---

## Patients (`patients.ts`)

### CreatePatientRequest

```typescript
interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;                 // YYYY-MM-DD
  gender?: Gender;
  phoneNumber?: string;
  diagnosis?: string;
  initialParalysisDegree?: number;     // int, 1–6 (House-Brackmann)
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
```

### UpdatePatientRequest

```typescript
interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;                // YYYY-MM-DD
  gender?: Gender;
  phoneNumber?: string;
  status?: PatientStatus;
  diagnosis?: string;
  initialParalysisDegree?: number;     // int, 1–6
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
```

### PatientResponse

```typescript
interface PatientResponse {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;          // YYYY-MM-DD or null
  gender: Gender | null;
  phoneNumber: string | null;
  email: string | null;
  status: PatientStatus;
  diagnosis: string | null;
  initialParalysisDegree: number | null;
  clinicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  avatarUrl: string | null;
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}
```

### AccessCodeResponse

```typescript
interface AccessCodeResponse {
  accessCode: string;    // plain-text 6-digit code (shown once)
  patientId: string;
}
```

### AccessCodeStatusResponse

```typescript
interface AccessCodeStatusResponse {
  hasAccessCode: boolean;
}
```

---

## Routines (`routines.ts`)

### RoutineItemRequest

```typescript
interface RoutineItemRequest {
  exerciseId: string;
  sets: number;                  // int, >= 1
  repsPerSet: number;            // int, >= 1
  targetHoldSeconds: number;     // int, >= 0
  restBetweenSets?: number;      // int, >= 0, default 10
  difficultyLevel?: number;      // float, default 1.0
  strictMode?: boolean;          // default false
  allowSkip?: boolean;           // default true
}
```

### CreateRoutineRequest

```typescript
interface CreateRoutineRequest {
  patientId: string;
  name: string;
  startDate: string;             // ISO 8601
  endDate?: string;              // ISO 8601
  therapistNotes?: string;
  items: RoutineItemRequest[];
}
```

### UpdateRoutineRequest

```typescript
interface UpdateRoutineRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  therapistNotes?: string;
  items?: RoutineItemRequest[];
}
```

### RoutineItemResponse

```typescript
interface RoutineItemResponse {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;            // int
  sets: number;                  // int
  repsPerSet: number;            // int
  targetHoldSeconds: number;     // int
  difficultyLevel: number;       // float
  restBetweenSets: number;       // int
  strictMode: boolean;
  allowSkip: boolean;
  exercise?: ExerciseResponse;
}
```

### RoutineResponse

```typescript
interface RoutineResponse {
  id: string;
  patientId: string;
  name: string;
  startDate: string;             // ISO 8601
  endDate: string | null;
  status: RoutineStatus;
  therapistNotes: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: PatientResponse;
  items?: RoutineItemResponse[];
  sessionsCount?: number;        // int, computed
}
```

---

## Exercises (`exercises.ts`)

### CreateExerciseRequest

```typescript
interface CreateExerciseRequest {
  keyName: string;
  name: string;
  description?: string;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
  defaultConfig?: ExerciseDefaultConfig;
}
```

### UpdateExerciseRequest

```typescript
interface UpdateExerciseRequest {
  keyName?: string;
  name?: string;
  description?: string;
  type?: ExerciseType;
  category?: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
  defaultConfig?: ExerciseDefaultConfig;
}
```

### ExerciseDefaultConfig

```typescript
interface ExerciseDefaultConfig {
  threshold?: number;    // float, 0–1
  holdTime?: number;     // int, seconds
  restTime?: number;     // int, seconds
}
```

### ExerciseResponse

```typescript
interface ExerciseResponse {
  id: string;
  keyName: string;
  name: string;
  description: string | null;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule: MobileModule | null;
  assetAnimationUrl: string | null;
  assetTutorialVideoUrl: string | null;
  defaultConfig: ExerciseDefaultConfig | null;
  createdAt: string;
}
```

---

## Sessions (`sessions.ts`)

### SessionItemRequest

```typescript
interface SessionItemRequest {
  exerciseId: string;
  repsCompleted: number;          // int
  difficulty?: number;            // int, default 0
  averageAccuracy?: number;       // float, 0–100 (symmetry score)
  seriesData?: unknown;           // JSON blob — detailed per-rep data
}
```

### CreateSessionRequest

```typescript
interface CreateSessionRequest {
  routineId: string;
  startTime: string;              // ISO 8601
  endTime: string;                // ISO 8601
  items: SessionItemRequest[];
}
```

> **Note**: `isSynced` and `syncedAt` are local-only mobile fields and MUST NOT appear in this request.

### SessionResponse

```typescript
interface SessionResponse {
  id: string;
  routineId: string;
  date: string;                   // ISO 8601
  durationSeconds: number;        // int
  score: number;                  // int, 0–100
  createdAt: string;
  items?: SessionItemResponse[];
}
```

### SessionItemResponse

```typescript
interface SessionItemResponse {
  id: string;
  sessionId: string;
  exerciseId: string;
  repsCompleted: number;
  difficulty: number;
  averageAccuracy: number | null;
  seriesData: unknown | null;
}
```

---

## Mobile (`mobile.ts`)

### ActiveRoutineResponse

```typescript
interface ActiveRoutineResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: RoutineStatus;
  items: ActiveRoutineItemResponse[];
}
```

### ActiveRoutineItemResponse

```typescript
interface ActiveRoutineItemResponse {
  id: string;
  orderIndex: number;
  sets: number;                   // canonical name (was targetSets)
  repsPerSet: number;             // canonical name (was targetRepetitions)
  targetHoldSeconds: number;      // canonical name (was holdTimeSeconds)
  restBetweenSets: number;        // canonical name (was restBetweenSetsSeconds)
  difficultyLevel: number;
  strictMode: boolean;
  exercise: ActiveRoutineExerciseResponse;
}
```

### ActiveRoutineExerciseResponse

```typescript
interface ActiveRoutineExerciseResponse {
  id: string;
  name: string;
  keyName: string;
  description: string | null;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule: MobileModule | null;
  assetAnimationUrl: string | null;
  assetTutorialVideoUrl: string | null;
}
```

---

## Analytics (`analytics.ts`)

### RoutineStatsResponse

```typescript
interface RoutineStatsResponse {
  summary: {
    totalSessions: number;       // int
    currentStreak: number;       // int, consecutive days
    avgScore: number;            // int, 0–100
  };
  chartData: RoutineChartPoint[];
}
```

### RoutineChartPoint

```typescript
interface RoutineChartPoint {
  date: string;                  // YYYY-MM-DD
  score: number;                 // int, 0–100
}
```

### RoutineHistoryResponse

Alias: `SessionResponse[]` — the history endpoint returns an array of session responses.

---

## Dashboard (`dashboard.ts`)

### DashboardStatsResponse

```typescript
interface DashboardStatsResponse {
  metrics: {
    activePatients: DashboardMetric;
    complianceAlerts: DashboardMetric;
    avgEfficacy: DashboardMetric;
  };
  atRiskPatients: AtRiskPatientResponse[];
}
```

### DashboardMetric

```typescript
interface DashboardMetric {
  value: number;    // int
  trend: number;    // int, percentage change (0 = no trend data)
}
```

### AtRiskPatientResponse

```typescript
interface AtRiskPatientResponse {
  id: string;
  name: string;
  daysInactive: number;          // int
  avatarUrl: string | null;
}
```

---

## Relationship Summary

```
Therapist ──1:N──▶ Patient ──1:N──▶ Routine ──1:N──▶ RoutineItem ──N:1──▶ Exercise
                                      │
                                      └──1:N──▶ Session ──1:N──▶ SessionItem ──N:1──▶ Exercise
```

All IDs are UUIDs. All relationships are enforced by the Prisma schema with foreign keys.
