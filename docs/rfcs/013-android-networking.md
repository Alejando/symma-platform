# RFC-013: Android Networking & API Client Integration (MOB-2)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | MOB-1 (Project Setup), Sprint 0 (Backend API) |
| **Scope** | Mobile Codebase (`core/network`, `data/`) |
| **Tech Stack** | Retrofit, OkHttp, Moshi (or Gson), Hilt |

## 1. Objective
Implement the Networking Layer to communicate with the Symma Backend.
The app needs to consume the endpoints defined in Sprint 0:
1.  **Patient Auth:** `POST /auth/patient/login`
2.  **Routine Sync:** `GET /mobile/routine/active`

## 2. Technical Specifications

### 2.1 Backend Contract (Reference)
* **Base URL:** `http://10.0.2.2:4000/api/` (Android Emulator localhost alias).
* **Endpoints:**
    * `Login`: Accepts `{ patientId, accessCode }`. Returns `{ accessToken }`.
    * `GetRoutine`: Requires Header `Authorization: Bearer <token>`. Returns `{ id, name, items: [...] }`.

### 2.2 Architecture Implementation
We must follow the Clean Architecture layers defined in MOB-1.

#### A. Core Layer (`core/network`)
* **`SymmaApiService` Interface:** Define the Retrofit functions with `@POST` and `@GET` annotations.
* **`AuthInterceptor`:** An OkHttp Interceptor that reads the Token from SharedPreferences (or DataStore) and injects it into the `Authorization` header of every request.

#### B. Data Layer (`data/dto`)
* **Data Transfer Objects (DTOs):** Create Kotlin data classes that match the JSON response EXACTLY.
    * `LoginRequestDto`, `LoginResponseDto`.
    * `RoutineDto`, `ExerciseDto`, `RoutineItemDto`.
    * *Rule:* Use `@Json(name = "field_name")` annotations to map snake_case JSON to camelCase Kotlin.

#### C. Domain Mapper (`data/mapper`)
* Create extension functions to convert DTOs -> Domain Models.
    * *Why?* If the Backend changes a field name, we only fix the Mapper, not the entire UI code.

## 3. Implementation Steps (Agent Instructions)

1.  **DTO Generation:**
    * Look at the Swagger definition (or RFC-011).
    * Create the DTO data classes in `data/remote/dto`.

2.  **Retrofit Service:**
    * Create `SymmaApiService.kt`.
    * Define `loginPatient` and `getActiveRoutine` methods.

3.  **Dependency Injection (Hilt):**
    * Update `NetworkModule.kt` (created in MOB-1).
    * Provide the `SymmaApiService` singleton.
    * Provide the `OkHttpClient` with the `AuthInterceptor`.

4.  **Repository Setup:**
    * Create `AuthRepository` interface (Domain).
    * Create `AuthRepositoryImpl` (Data) that calls the API.

---

## 4. Acceptance Criteria

* **[ ] Compilation:** Code compiles with new DTOs and Interfaces.
* **[ ] Type Safety:** JSON fields like `rest_between_sets_seconds` are correctly mapped to Kotlin properties.
* **[ ] DI Check:** The App builds, confirming Hilt can provide the `ApiService`.