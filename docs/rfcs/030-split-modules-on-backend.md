# RFC-030: Backend Update - Explicit Schema, Modules & Tests

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Scope** | `Backend (Prisma/NestJS)`, `Database`, `Frontend (React)`, `QA` |
| **Goal** | Implement explicit columns for Routine Items, update the Web Form with validation, and ensure stability via automated tests. |

## 1. Schema Definition (Prisma)

### 1.1 Enums Definition
**A. MobileModule**
Defines the clinical strategy.
```prisma
enum MobileModule {
  EYES
  EYES_INVERSE
  BROWS
  JAW
  SMILE
  KISS
}
```

**B. ExerciseType**
Defines the execution mode.
```prisma
enum ExerciseType {
  ISOTONIC  // Repetition based
  ISOMETRIC // Time-hold based
}
```

### 1.2 `RoutineItem` Model
The model must include explicit columns.

```prisma
model RoutineItem {
  id String @id @default(uuid())
  // ... relations ...

  // Config Columns
  mobile_module     MobileModule
  exercise_type     ExerciseType
  difficulty_level  Float   @default(1.0)
  
  // Structure
  sets              Int     @default(1)
  reps_per_set      Int     @default(10)
  rest_between_sets Int     @default(10)
  
  // Logic
  target_hold_seconds Int     @default(0)
  strict_mode       Boolean @default(false)
  allow_skip        Boolean @default(true)
}
```

## 2. Backend Implementation

### 2.1 Seed Script (`prisma/seed.ts`)
Create "Mixed Eye Therapy" routine.
* Item 1: `ISOMETRIC` / `EYES` (2 Sets, 5 Reps, Hold 3s).
* Item 2: `ISOTONIC` / `EYES_INVERSE` (1 Set, 12 Reps, Hold 0s).

### 2.2 DTOs
* **`CreateRoutineItemDto`:** Use `class-validator`.
    * `sets`: `@Min(1)`
    * `difficulty_level`: `@Min(0.1)`
    * `mobile_module`: `@IsEnum(MobileModule)`

### 2.3 Backend Testing Strategy
We must ensure the API correctly parses and validates these new fields.

* **Unit Tests (`routine.service.spec.ts`):**
    * Test creating an Item with valid Enums -> Success.
    * Test creating an Item with invalid Enum string -> Throw Error.
    * Test boundary values (e.g., Sets = 0) -> Throw Error.
* **Integration Tests (`routine.e2e-spec.ts`):**
    * Call `POST /routines` with the full payload.
    * Verify the response contains the flat structure (no `config` object).

## 3. Web Dashboard Implementation (Frontend)

The Frontend must provide a robust form with visual validation and conditional logic.

### 3.1 Form Components & UX
The `RoutineItemForm` must include:

* **Enum Selectors (Combobox/Select):**
    * `Mobile Module`: Renders human-readable labels (e.g., "EYES" -> "Ojos (Cerrar)").
    * `Exercise Type`: "Isotónico (Reps)" vs "Isométrico (Sostener)".
* **Numeric Inputs:**
    * Fields: `Sets`, `Reps`, `Rest Time (s)`, `Hold Time (s)`, `Difficulty (0.1 - 2.0)`.
    * **UX Requirement:** If `Exercise Type` is **ISOTONIC**, the `Hold Time` input should be disabled or hidden (implied 0s).
* **Toggles (Switch):**
    * `Strict Mode` (Label: "Reiniciar si falla").
    * `Allow Skip` (Label: "Permitir saltar").

### 3.2 Frontend Validation (Zod/Yup)
Implement schema validation before sending to API.
* `sets`: Required, Min 1.
* `reps_per_set`: Required, Min 1.
* `difficulty_level`: Min 0.1, Max 3.0.

### 3.3 Frontend Testing
* **Component Test (`RoutineItemForm.test.tsx`):**
    * Render form.
    * Select "Isotonic" -> Verify "Hold Time" is disabled/hidden.
    * Submit empty form -> Show validation errors.
    * Fill valid data -> Verify `onSubmit` payload matches DTO.

## 4. Acceptance Criteria

* **[ ] Schema:** DB columns created, JSON field removed.
* **[ ] Backend Tests:** `npm run test:unit` passes for RoutineService.
* **[ ] Frontend UX:** The form dynamically handles Isotonic/Isometric states.
* **[ ] Frontend Tests:** Tests confirm that the payload is correctly formatted before API call.