# Tasks: Isometric Release and Calibration Reliability

**Input**: Design documents from `/specs/001-fix-isometric-calibration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Unit tests are included because this repo requires tests for all new behavior and this feature changes clinical session/calibration logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare shared constants, docs, and feature scaffolding used by all stories.

- [X] T001 Define feature constants for rep gating and calibration thresholds in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/domain/logic/CalibrationUtils.kt
- [X] T002 Add implementation notes for release-gating defaults and fallback behavior in /Users/alejandroprado/pratum/symma-platform/specs/001-fix-isometric-calibration/research.md
- [X] T003 [P] Sync quick manual validation steps with final implementation checkpoints in /Users/alejandroprado/pratum/symma-platform/specs/001-fix-isometric-calibration/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model/mapping foundations required before story-specific behavior.

**⚠️ CRITICAL**: Complete this phase before implementing user stories.

- [X] T004 Extend exercise execution config with optional engage/release thresholds in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/domain/model/ExerciseConfig.kt
- [X] T005 [P] Add optional `engageThreshold` and `releaseThreshold` fields in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/data/remote/dto/routine/RoutineItemDto.kt
- [X] T006 [P] Map optional threshold fields from DTO to domain/entity in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/data/mapper/RoutineMapper.kt
- [X] T007 Add safe threshold defaults and validation guards in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T008 Update contract notes with optional additive threshold fields in /Users/alejandroprado/pratum/symma-platform/specs/001-fix-isometric-calibration/contracts/exercise-engine-calibration.openapi.yaml

**Checkpoint**: Foundation ready for US1/US2/US3 work.

---

## Phase 3: User Story 1 - Release-gated repetition counting (Priority: P1) 🎯 MVP

**Goal**: Require relax/release before counting next repetition for both isometric and isotonic exercises.

**Independent Test**: Hold/keep gesture active after completing a rep; next rep must not progress until release + re-engage.

### Tests for User Story 1

- [X] T009 [P] [US1] Add isometric release-gating regression tests in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/player/PlayerViewModelTest.kt
- [X] T010 [P] [US1] Add isotonic release-gating regression tests in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/player/PlayerViewModelTest.kt

### Implementation for User Story 1

- [X] T011 [US1] Add `awaitingRelease` state machine flow for isometric and isotonic reps in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T012 [US1] Implement hysteresis engage/release evaluation for score transitions in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T013 [US1] Prevent next-rep progression while awaiting release in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T014 [US1] Preserve strict-mode hold reset semantics with new release-gating flow in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T015 [US1] Surface release-required guidance text/state in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerUiState.kt
- [X] T016 [US1] Render release-required indicator in overlay controls in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerScreen.kt

**Checkpoint**: US1 works independently and is MVP-ready.

---

## Phase 4: User Story 2 - Rep completion sound feedback (Priority: P2)

**Goal**: Emit exactly one completion sound per completed repetition.

**Independent Test**: Complete a repetition and verify one ding plays; no ding while repetition is incomplete.

### Tests for User Story 2

- [X] T017 [P] [US2] Add one-ding-per-rep event emission tests in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/player/PlayerViewModelTest.kt

### Implementation for User Story 2

- [X] T018 [US2] Collect `PlayerEvent` stream in UI lifecycle-safe effect in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerScreen.kt
- [X] T019 [US2] Implement local lightweight tone playback handlers for tick/ding/success in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerScreen.kt
- [X] T020 [US2] Add guarded fallback behavior when audio output is unavailable in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerScreen.kt

**Checkpoint**: US2 works independently with US1 unchanged.

---

## Phase 5: User Story 3 - Calibration reliability for brows/eyes (Priority: P3)

**Goal**: Improve BrowRaise/EyesClosed calibration robustness under noise and realistic effort.

**Independent Test**: Run calibration with mild noise; BrowRaise/EyesClosed complete with valid thresholds and exercises remain achievable.

### Tests for User Story 3

- [X] T021 [P] [US3] Add BrowRaise metric-alignment tests (capture vs runtime scoring inputs) in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/features/calibration/CalibrationViewModelTest.kt
- [X] T022 [P] [US3] Add step-specific threshold behavior tests for EyesClosed/BrowRaise in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/features/calibration/CalibrationViewModelTest.kt
- [X] T023 [P] [US3] Add minimum valid-sample gating tests before step finalization in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/presentation/features/calibration/CalibrationViewModelTest.kt

### Implementation for User Story 3

- [X] T024 [US3] Align BrowRaise capture formula with runtime strategy inputs in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/features/calibration/CalibrationViewModel.kt
- [X] T025 [US3] Replace global gesture threshold usage with step-specific thresholds in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/features/calibration/CalibrationViewModel.kt
- [X] T026 [US3] Enforce minimum valid stable samples before step completion in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/features/calibration/CalibrationViewModel.kt
- [X] T027 [US3] Keep calibration feedback/state coherent when sample quality is insufficient in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/features/calibration/CalibrationScreen.kt

**Checkpoint**: US3 works independently and preserves prior stories.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, cleanup, and validation across all stories.

- [X] T028 [P] Remove confirmed-unused legacy branches in rep/calibration flow with no references in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/player/PlayerViewModel.kt
- [X] T029 [P] Remove confirmed-unused calibration legacy code paths in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/main/java/com/symma/app/presentation/features/calibration/CalibrationViewModel.kt
- [X] T030 Run full mobile unit test suite and fix regressions in /Users/alejandroprado/pratum/symma-platform/apps/mobile/app/src/test/java/com/symma/app/
- [X] T031 Execute quickstart validation and update observed results in /Users/alejandroprado/pratum/symma-platform/specs/001-fix-isometric-calibration/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Phase 1.
- **Phase 3 (US1)**: depends on Phase 2.
- **Phase 4 (US2)**: depends on Phase 2; can run after US1 baseline if sharing PlayerScreen changes.
- **Phase 5 (US3)**: depends on Phase 2; independent from US2.
- **Phase 6 (Polish)**: depends on completion of selected stories.

### User Story Dependencies

- **US1 (P1)**: base MVP; no dependency on US2/US3.
- **US2 (P2)**: depends on player event flow (can be implemented after US1 core transitions).
- **US3 (P3)**: independent calibration path; only depends on foundational threshold/config setup.

### Parallel Opportunities

- T005, T006 can run in parallel in Phase 2.
- T009 and T010 can run in parallel in US1 tests.
- T021, T022, T023 can run in parallel in US3 tests.
- T028 and T029 can run in parallel during polish once behavior is locked.

---

## Parallel Example: User Story 1

```bash
# Parallel US1 test tasks
T009: Add isometric release-gating regression tests in .../PlayerViewModelTest.kt
T010: Add isotonic release-gating regression tests in .../PlayerViewModelTest.kt

# Then implement sequential state-machine tasks
T011 -> T012 -> T013 -> T014 -> T015 -> T016
```

## Parallel Example: User Story 3

```bash
# Parallel US3 test tasks
T021: BrowRaise metric-alignment tests in .../CalibrationViewModelTest.kt
T022: Step-threshold behavior tests in .../CalibrationViewModelTest.kt
T023: Valid-sample gating tests in .../CalibrationViewModelTest.kt

# Then implement sequential calibration updates
T024 -> T025 -> T026 -> T027
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Implement US1 (Phase 3) end-to-end.
3. Validate US1 independently with quickstart scenario A + B.

### Incremental Delivery

1. Deliver US1 (release-gated counting).
2. Deliver US2 (audio cue) without changing US1 acceptance.
3. Deliver US3 (calibration robustness) with independent calibration validation.
4. Finish with Phase 6 cleanup and full test run.

### Format Validation

All tasks follow strict checklist format:
- checkbox prefix `- [ ]`
- sequential Task ID `T001..T031`
- `[P]` marker only for parallelizable tasks
- `[US#]` marker only inside user story phases
- each task description contains an exact file path
