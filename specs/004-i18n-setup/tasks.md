# Tasks: Internationalization (i18n) Setup

**Input**: Design documents from `/specs/004-i18n-setup/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included per Constitution Principle V (Test-Driven Quality)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Shared package**: `packages/i18n/`
- **Web app**: `apps/web/src/`
- **API**: `apps/api/src/`
- **Mobile**: `apps/mobile/app/src/main/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared i18n package and install dependencies

+ [x] T001 Create packages/i18n/ directory structure with src/locales/es/
+ [x] T002 Create packages/i18n/package.json with @symma/i18n configuration
+ [x] T003 Create packages/i18n/tsconfig.json extending @symma/typescript-config
+ [x] T004 [P] Install next-intl dependency in apps/web/ via pnpm
+ [x] T005 [P] Install nestjs-i18n dependency in apps/api/ via pnpm
+ [x] T006 Run pnpm install from repo root to link workspace packages

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core translation files and types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

+ [x] T007 Create packages/i18n/src/locales/es/common.json with UI strings (nav, buttons, labels, messages, pagination, time)
+ [x] T008 [P] Create packages/i18n/src/locales/es/errors.json with error messages
+ [x] T009 [P] Create packages/i18n/src/locales/es/validation.json with form validation messages
+ [x] T010 Create packages/i18n/src/types.ts with Locale, TranslationNamespace, and enum types
+ [x] T011 Create packages/i18n/src/index.ts exporting all types and translation files
+ [x] T012 [P] Create apps/mobile/app/src/main/res/values/strings.xml with Spanish UI strings

**Checkpoint**: Foundation ready - translation files exist, package exports configured

---

## Phase 3: User Story 1 - Visualización de Interfaz en Español (Priority: P1) 🎯 MVP

**Goal**: All UI text in web and mobile apps displays in Spanish

**Independent Test**: Navigate any screen in web/mobile app and verify all visible text is in Spanish

### Tests for User Story 1

+ [x] T013 [P] [US1] Create packages/i18n/src/index.test.ts testing package exports
+ [x] T014 [P] [US1] Create apps/web/src/i18n/config.test.ts testing i18n configuration

### Implementation for User Story 1 - Web

+ [x] T015 [US1] Create apps/web/src/i18n/config.ts with messages import from @symma/i18n
+ [x] T016 [US1] Create apps/web/src/i18n/request.ts with getRequestConfig for next-intl
+ [x] T017 [US1] Update apps/web/next.config.mjs to use createNextIntlPlugin
+ [x] T018 [US1] Update apps/web/src/app/layout.tsx to wrap with NextIntlClientProvider
+ [x] T019 [US1] Update existing web components to use useTranslations hook for UI text

### Implementation for User Story 1 - API

+ [x] T020 [US1] Create apps/api/src/i18n/i18n.module.ts with nestjs-i18n configuration
+ [x] T021 [US1] Create apps/api/src/i18n/i18n.service.ts with TranslationService
+ [x] T022 [US1] Create apps/api/src/i18n/i18n.service.spec.ts with unit tests
+ [x] T023 [US1] Copy translation files to apps/api/src/i18n/locales/ via prebuild script
+ [x] T024 [US1] Register AppI18nModule in apps/api/src/app.module.ts

### Implementation for User Story 1 - Mobile

+ [x] T025 [P] [US1] Update existing Compose UI to use stringResource() for all text
+ [x] T026 [US1] Verify all hardcoded strings in mobile app are replaced with string resources

**Checkpoint**: Web and mobile apps display all UI text in Spanish

---

## Phase 4: User Story 2 - Visualización de Enums Traducidos (Priority: P1)

**Goal**: Enum values (ACTIVE, PENDING, etc.) display as Spanish translations in UI

**Independent Test**: View any record with enum field and verify Spanish translation appears (e.g., "Activo" not "ACTIVE")

### Tests for User Story 2

+ [x] T027 [P] [US2] Create packages/i18n/src/enums.test.ts testing translateEnum functions
+ [x] T028 [P] [US2] Create apps/web/src/components/ui/enum-label.test.tsx testing EnumLabel component
+ [x] T029 [P] [US2] Create apps/mobile/app/src/test/java/com/symma/app/i18n/EnumTranslationsTest.kt

### Implementation for User Story 2 - Shared Package

+ [x] T030 [US2] Create packages/i18n/src/locales/es/enums.json with all enum translations (Role, Gender, PatientStatus, ExerciseType, ExerciseCategory, RoutineStatus, MobileModule)
+ [x] T031 [US2] Create packages/i18n/src/enums.ts with translateEnum utility and convenience functions
+ [x] T032 [US2] Export enum utilities from packages/i18n/src/index.ts

### Implementation for User Story 2 - Web

+ [x] T033 [US2] Create apps/web/src/components/ui/enum-label.tsx component using useTranslations
+ [x] T034 [US2] Update existing web components displaying enums to use EnumLabel component

### Implementation for User Story 2 - API

+ [x] T035 [US2] Add translateEnum method to apps/api/src/i18n/i18n.service.ts
+ [x] T036 [US2] Update apps/api/src/i18n/i18n.service.spec.ts with enum translation tests

### Implementation for User Story 2 - Mobile

+ [x] T037 [US2] Create apps/mobile/app/src/main/java/com/symma/app/i18n/EnumTranslations.kt with extension functions
+ [x] T038 [US2] Create apps/mobile/app/src/main/java/com/symma/app/i18n/EnumComposables.kt with Compose helpers
+ [x] T039 [US2] Update existing Compose UI displaying enums to use displayName() extensions

**Checkpoint**: All enum values display in Spanish while database stores original values

---

## Phase 5: User Story 3 - Traducciones Compartidas entre Aplicaciones (Priority: P2)

**Goal**: Translations centralized in @symma/i18n package, consumed by web and API

**Independent Test**: Modify a translation in packages/i18n, rebuild apps, verify change reflects in both

### Tests for User Story 3

+ [x] T040 [P] [US3] Create packages/i18n/src/locales.test.ts verifying all JSON files are valid and complete

### Implementation for User Story 3

+ [x] T041 [US3] Add prebuild script to apps/api/package.json copying locales from @symma/i18n
+ [x] T042 [US3] Verify apps/web imports translations directly from @symma/i18n (no copy needed)
+ [x] T043 [US3] Document sync process for mobile in packages/i18n/README.md
+ [x] T044 [US3] Create script packages/i18n/scripts/sync-mobile.ts to generate mobile strings from JSON

**Checkpoint**: Single source of truth for translations, consumed by web and API

---

## Phase 6: User Story 4 - Preparación para Multi-idioma Futuro (Priority: P3)

**Goal**: Architecture supports adding new languages without code changes

**Independent Test**: Add packages/i18n/src/locales/en/ with English translations, verify structure supports it

### Tests for User Story 4

+ [x] T045 [P] [US4] Create packages/i18n/src/fallback.test.ts testing fallback behavior for missing keys

### Implementation for User Story 4

+ [x] T046 [US4] Update packages/i18n/src/types.ts to support multiple locales (Locale = 'es' | 'en')
+ [x] T047 [US4] Configure next-intl onError handler in apps/web/src/i18n/request.ts for missing key warnings
+ [x] T048 [US4] Configure nestjs-i18n fallback in apps/api/src/i18n/i18n.module.ts
+ [x] T049 [US4] Document adding new language process in packages/i18n/README.md

**Checkpoint**: Adding English requires only new translation files, no code changes

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

+ [x] T050 [P] Create packages/i18n/README.md with usage documentation
+ [x] T051 [P] Update apps/web/README.md with i18n usage section
+ [x] T052 [P] Update apps/api/README.md with i18n usage section
+ [x] T053 Create apps/api/src/common/filters/i18n-exception.filter.ts for translated error responses
+ [x] T054 Create apps/api/src/common/decorators/i18n-validation.decorator.ts for translated validation
+ [x] T055 Register I18nExceptionFilter in apps/api/src/app.module.ts
+ [x] T056 Run pnpm build to verify all packages compile
+ [x] T057 Run pnpm test to verify all tests pass
+ [x] T058 Run quickstart.md validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority - can run in parallel
  - US3 depends on US1 (web i18n must be configured first)
  - US4 depends on US1-US3 (architecture must be in place)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 | P1 | Foundational | US2 |
| US2 | P1 | Foundational | US1 |
| US3 | P2 | US1 | - |
| US4 | P3 | US1, US2, US3 | - |

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Shared package changes before app-specific changes
3. Web and API can be implemented in parallel
4. Mobile can be implemented in parallel with web/API

### Parallel Opportunities

**Phase 1 (Setup)**:
- T004, T005 can run in parallel (different apps)

**Phase 2 (Foundational)**:
- T008, T009 can run in parallel (different JSON files)
- T012 can run in parallel with T007-T011 (different app)

**Phase 3 (US1)**:
- T013, T014 can run in parallel (different test files)
- T025 can run in parallel with T015-T024 (mobile vs web/api)

**Phase 4 (US2)**:
- T027, T028, T029 can run in parallel (different test files)

**Phase 7 (Polish)**:
- T050, T051, T052 can run in parallel (different README files)

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task T027: "Create packages/i18n/src/enums.test.ts"
Task T028: "Create apps/web/src/components/ui/enum-label.test.tsx"
Task T029: "Create apps/mobile/.../EnumTranslationsTest.kt"

# After tests written, launch shared package work:
Task T030: "Create packages/i18n/src/locales/es/enums.json"
Task T031: "Create packages/i18n/src/enums.ts"

# Then launch app-specific work in parallel:
Task T033: "Create apps/web/src/components/ui/enum-label.tsx" (Web)
Task T037: "Create apps/mobile/.../EnumTranslations.kt" (Mobile)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (UI in Spanish)
4. Complete Phase 4: User Story 2 (Enums translated)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready - users see Spanish UI with translated enums

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 | Spanish UI, translated enums |
| +1 | US3 | Centralized translations |
| +2 | US4 | Multi-language ready |

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Web + API)
   - Developer B: User Story 2 (Shared + Mobile)
3. Stories integrate via shared package

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Mobile strings.xml must be manually synced from JSON (documented in US3)
