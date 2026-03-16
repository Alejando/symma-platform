<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 0.0.0 → 1.0.0
  Bump rationale: MAJOR — initial constitution creation for the
    Symma Platform project.

  Added principles:
    - I. Patient Privacy First
    - II. Offline-First Mobile
    - III. On-Device Computer Vision
    - IV. Type Safety Across Boundaries
    - V. Test-Driven Quality (NON-NEGOTIABLE)
    - VI. Clinical Accuracy
    - VII. Monorepo Cohesion

  Added sections:
    - Technology Stack Constraints
    - Development Workflow

  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — Constitution Check
        section aligns with 7 principles; no changes needed.
    ✅ .specify/templates/spec-template.md — scope/requirements
        structure compatible; no changes needed.
    ✅ .specify/templates/tasks-template.md — task phases and
        parallel markers compatible; no changes needed.

  Follow-up TODOs: none.
-->

# Symma Platform Constitution

## Core Principles

### I. Patient Privacy First

- All computer-vision processing MUST execute on-device; raw
  video frames MUST NOT leave the device or be recorded.
- The mobile app MUST request Camera permission with a clear
  therapeutic-necessity explanation before first use.
- Sensitive data transmission between mobile and API MUST use
  TLS 1.3 or higher.
- The local Room database MUST be encrypted via SQLCipher.
- Offline authentication MUST use Biometrics or a hashed PIN;
  plain-text credentials MUST NOT be stored locally.
- The platform MUST comply with Mexico's LFPDPPP for personal
  data protection.

**Rationale**: Symma handles biometric health data from
patients with facial paralysis. Privacy violations could cause
legal liability and erode patient trust.

### II. Offline-First Mobile

- The local Room database is the single source of truth for
  the Android app; the app MUST be fully functional without
  network connectivity.
- Exercise sessions, calibration data, and results MUST be
  persisted to Room immediately upon creation.
- Synchronization with the backend API MUST be handled by
  WorkManager, batching pending sessions when connectivity is
  detected.
- Every entity stored locally MUST carry an `is_synced` flag
  and a `synced_at` timestamp for conflict resolution.
- The app MUST gracefully degrade (no crashes, no data loss)
  when transitioning between online and offline states.

**Rationale**: Patients perform exercises at home or in
clinical settings where connectivity is unreliable. Data loss
during a session is unacceptable.

### III. On-Device Computer Vision

- The app MUST use MediaPipe Tasks Vision (FaceLandmarker)
  with the 478-point face mesh model for facial analysis.
- Blendshape extraction (e.g., `mouthSmileLeft`,
  `browDownRight`) MUST run at a minimum of 30 fps on target
  devices (SDK 26+).
- CV output MUST be limited to metadata (scores) and a single
  snapshot image of the best attempt per exercise; no video
  recording.
- Exercise repetition counting and visual feedback MUST be
  derived from blendshape scores and configurable thresholds
  defined per `RoutineItem`.
- The success threshold (`0.0–1.0`) MUST be personalizable
  per patient via the API-delivered routine configuration.

**Rationale**: On-device processing ensures privacy, low
latency, and offline capability. MediaPipe provides
clinically relevant facial landmarks without cloud
dependency.

### IV. Type Safety Across Boundaries

- The `packages/shared-types` package MUST define the
  contract between `apps/api` and `apps/web`; both apps MUST
  import types from this package instead of duplicating them.
- TypeScript strict mode MUST be enabled in all TS projects
  (`apps/api`, `apps/web`, `packages/*`).
- All API request/response DTOs in NestJS MUST use
  `class-validator` and `class-transformer` decorators.
- Kotlin data classes in `apps/mobile` MUST mirror the Prisma
  schema entities for Room and network models.
- Import aliases MUST be used: `@/` for `apps/web/src`,
  `@symma/*` for internal packages.

**Rationale**: A monorepo is only valuable if types flow
consistently. Mismatched contracts between API, web, and
mobile cause silent runtime failures.

### V. Test-Driven Quality (NON-NEGOTIABLE)

- Every new module, service, controller, ViewModel, UseCase,
  or Repository MUST have a corresponding unit test file.
- Test files MUST be co-located with source:
  - `apps/api`: `*.spec.ts` next to `*.ts`
  - `apps/web`: `*.test.ts` or `*.test.tsx` next to source
  - `apps/mobile`: `app/src/test/` with JUnit + MockK
- Test frameworks:
  - API: Jest + Supertest
  - Web: Vitest + Testing Library
  - Mobile: JUnit + MockK + Turbine (for Flows)
- Critical API endpoints MUST have E2E tests in
  `apps/api/test/`.
- No PR MUST be merged if any existing test fails.

**Rationale**: The platform handles clinical rehabilitation
data. Regressions in scoring, sync, or calibration logic
can directly impact patient outcomes.

### VI. Clinical Accuracy

- The calibration system MUST capture a neutral-face baseline
  vector before every session; exercises MUST be scored
  relative to this baseline.
- Symmetry scores MUST be computed as the normalized
  difference between left/right blendshape pairs.
- The `initial_paralysis_degree` field (House-Brackmann
  scale, 1–6) MUST be used to contextualize patient progress;
  thresholds MUST adapt accordingly.
- Exercise types (ISOTONIC, ISOMETRIC, MANUAL, RELAXATION)
  MUST each have distinct counting and hold-time logic in the
  exercise engine.
- Session results (`max_score_achieved`, `avg_symmetry_score`,
  `hold_time_avg`, `repetitions_completed`) MUST be computed
  and persisted for every exercise attempt.

**Rationale**: Symma is a clinical tool. Inaccurate scoring
or miscounted repetitions undermines therapist trust and
patient rehabilitation outcomes.

### VII. Monorepo Cohesion

- The repository MUST use pnpm as the sole package manager;
  npm and yarn MUST NOT be used.
- Turborepo MUST orchestrate builds, tests, and linting
  across all workspaces.
- Shared configurations MUST live in dedicated packages:
  - `packages/database` — Prisma schema and client
  - `packages/shared-types` — TypeScript interfaces
  - `packages/eslint-config` — ESLint rules
  - `packages/config` — shared tsconfig
- The `Makefile` at the repo root MUST be the primary
  entry point for common operations (`make dev`, `make test`,
  `make build`, `make lint`).
- Docker Compose MUST define all infrastructure services
  (PostgreSQL on port 5440, API on 4001, Web on 4000).

**Rationale**: A monorepo without enforced cohesion drifts
into independent silos. Shared tooling reduces onboarding
friction and prevents configuration drift.

## Technology Stack Constraints

| Layer | Technology | Version / Config |
|-------|-----------|-----------------|
| **API** | NestJS | 11+ with Swagger |
| **ORM** | Prisma | Schema in `packages/database` |
| **Database** | PostgreSQL | 15, Dockerized, port 5440 |
| **Web** | Next.js | 16+ with App Router |
| **Web UI** | shadcn/ui + Radix UI | TailwindCSS v4, Lucide icons |
| **Mobile** | Android (Kotlin) | Min SDK 26, Target SDK 34 |
| **Mobile UI** | Jetpack Compose | Material Design 3 |
| **Mobile DI** | Hilt | — |
| **Mobile DB** | Room + SQLCipher | Offline-first |
| **Mobile Sync** | WorkManager | Background batched sync |
| **CV Engine** | MediaPipe | FaceLandmarker, 478 points |
| **Mobile Net** | Retrofit + OkHttp | — |
| **Mobile Arch** | MVVM + Clean Architecture | data/domain/presentation/di |

- All IDs MUST be UUIDs.
- The Prisma schema in `packages/database/prisma/schema.prisma`
  is the canonical data model.
- The mobile app MUST mirror relevant Prisma entities as Room
  entities for local persistence.
- The design system MUST use Inter font, Teal 600 (#0D9488)
  as primary, Rose 600 (#E11D48) for alerts, and Slate for
  base text/backgrounds.

## Development Workflow

### Code Style

| Element | Convention | Example |
|---------|-----------|---------|
| TS/TSX files | kebab-case | `user-profile.tsx` |
| React components | PascalCase | `UserProfile` |
| Functions/Variables | camelCase | `getUserProfile` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Kotlin files | PascalCase | `UserViewModel.kt` |
| Kotlin classes | PascalCase | `UserRepository` |

### Import Order (all TS projects)

1. External dependencies
2. Internal packages (`@symma/*`)
3. Relative project imports

### Pre-Commit Checklist

Every commit MUST pass:

1. `pnpm build` — no compilation errors
2. `pnpm lint` — no linting violations
3. `pnpm test` — all unit tests green
4. `pnpm check-types` — no type errors
5. `pnpm format` — consistent formatting

### Language Policy

- Source code (variables, functions, classes, comments):
  English
- User-facing documentation: Spanish permitted
- Commit messages: English preferred

## Governance

- This constitution supersedes all ad-hoc practices. Any
  deviation MUST be documented in the Complexity Tracking
  table of the relevant `plan.md` with explicit justification.
- Amendments require:
  1. A description of the change and its rationale.
  2. A version bump following SemVer (MAJOR for principle
     removal/redefinition, MINOR for additions, PATCH for
     clarifications).
  3. An updated Sync Impact Report at the top of this file.
  4. Propagation check across all `.specify/templates/*.md`.
- Compliance review: every PR review MUST verify adherence to
  the applicable principles. Reviewers MUST flag violations
  before approval.
- Runtime development guidance is maintained in
  `.agent/rules/` and `.windsurfrules`.

**Version**: 1.0.0 | **Ratified**: 2026-02-15 | **Last Amended**: 2026-02-15
