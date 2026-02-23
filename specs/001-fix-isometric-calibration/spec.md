# Feature Specification: Isometric Release and Calibration Reliability

**Feature Branch**: `001-fix-isometric-calibration`  
**Created**: 2026-02-20  
**Status**: Draft  
**Input**: User description: "Corregir ejercicios isométricos para exigir relajación entre repeticiones y emitir sonido al completar cada repetición. Ajustar calibración para BrowRaise y EyesClosed para reducir ruido, alinear métricas de calibración con ejecución clínica y mejorar completitud de repeticiones."

## Clarifications

### Session 2026-02-20

- Q: ¿La fase de relax aplica solo a ISOMETRIC o también a ISOTONIC? → A: También aplica a ISOTONIC antes de contar la siguiente repetición.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Isometric reps require release before next count (Priority: P1)

As a patient doing movement-based exercises (hold or count-based), I need each repetition to count only after I relax and perform the movement again, so the app reflects real therapeutic repetitions instead of chaining counts automatically.

**Why this priority**: This is the core clinical correctness issue and directly affects treatment quality and trust in session results.

**Independent Test**: Can be fully tested by running one isometric exercise with multiple reps and keeping the gesture continuously active after the first rep; the next rep must not start counting until the user releases and re-engages.

**Acceptance Scenarios**:

1. **Given** an isometric exercise rep is completed, **When** the user keeps the gesture active without relaxing, **Then** the next rep does not begin counting.
2. **Given** an isometric exercise rep is completed, **When** the user relaxes below release criteria and then performs the gesture again, **Then** the next rep starts and can be completed.
3. **Given** an isotonic exercise rep is completed, **When** the user keeps the same gesture active without relaxing, **Then** the next rep does not count until release and re-engagement occur.
4. **Given** an isometric exercise with strict hold expectations, **When** target is lost during a hold, **Then** hold progression follows configured strictness without phantom rep completion.

---

### User Story 2 - Rep completion feedback sound (Priority: P2)

As a patient, I need an immediate audio cue when a repetition is completed so I can pace myself without looking constantly at the screen.

**Why this priority**: Clear feedback improves usability and adherence, especially for patients focused on movement rather than UI.

**Independent Test**: Can be fully tested in a single exercise by completing one repetition and verifying exactly one completion sound is emitted.

**Acceptance Scenarios**:

1. **Given** an exercise repetition completes, **When** completion is detected, **Then** the app emits a completion sound cue once.
2. **Given** a repetition is still in progress, **When** the user has not completed it, **Then** no completion sound is emitted.

---

### User Story 3 - Reliable brow/eye calibration under noise (Priority: P3)

As a patient calibrating eye and brow gestures, I need calibration to ignore noisy spikes and use movement-specific capture rules so my exercises are achievable afterward.

**Why this priority**: Calibration quality determines whether users can realistically reach targets in later exercises.

**Independent Test**: Can be tested by running calibration for brow and eye steps with realistic movement plus occasional noise; resulting exercise targets should be reachable in normal performance.

**Acceptance Scenarios**:

1. **Given** a calibration step with intermittent noisy spikes, **When** baseline values are computed, **Then** transient outliers do not dominate the final baseline.
2. **Given** brow calibration, **When** brow movement is captured, **Then** the captured value model matches the same movement definition used during exercise scoring.
3. **Given** eyes-closed and brow steps, **When** the patient performs valid effort, **Then** the calibration step can complete without requiring unrealistic effort.

---

### Edge Cases

- User keeps the isometric target active indefinitely after rep completion.
- User repeatedly oscillates near release threshold (jitter around boundary) in either isometric or isotonic exercises.
- Completion sound output fails or is unavailable; session flow must continue.
- Calibration receives too few valid samples for a step due to instability/noise.
- User performs asymmetric brow/eye effort; calibration must still produce usable baselines.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST require a release phase between consecutive repetitions for both isometric and isotonic exercises.
- **FR-002**: The system MUST block progression for the next repetition until release criteria are met.
- **FR-003**: The system MUST only start counting the next repetition after release criteria are met and the target is re-attained.
- **FR-004**: The system MUST provide an immediate audible cue when a repetition is completed.
- **FR-005**: The system MUST ensure repetition completion cues are emitted once per completed repetition.
- **FR-006**: The system MUST align brow calibration measurement with the brow exercise scoring definition used during session execution.
- **FR-007**: The system MUST support gesture-specific calibration thresholds so brow and eye steps can be validated with appropriate sensitivity.
- **FR-008**: The system MUST ignore short-lived calibration outliers when deriving baseline values.
- **FR-009**: The system MUST require a minimum quality/quantity of valid calibration samples before finalizing each active calibration step.
- **FR-010**: The system MUST avoid finalizing a calibration step when valid sample criteria are not met and MUST continue or retry capture.
- **FR-011**: The system MUST preserve existing session progression behavior for repetition types outside isometric and isotonic.
- **FR-012**: The system MUST keep session and calibration flows operational even when optional feedback channels (sound/haptics) are unavailable.

### Key Entities *(include if feature involves data)*

- **Rep Cycle**: Represents one repetition lifecycle with phases: target reach, progression, rep completion, mandatory release, and re-engagement for isometric and isotonic movements.
- **Rep Feedback Event**: Represents one-shot patient feedback emitted when a repetition is completed.
- **Calibration Step Capture**: Represents per-gesture capture state including movement definition, valid sample count, quality gating, and finalized baseline output.
- **Calibration Baseline Profile**: Represents clinically meaningful per-gesture baseline values produced after noise-resistant calibration.

## Assumptions

- The release rule is based on objective gesture score thresholds and includes hysteresis to avoid jitter-driven false transitions.
- A simple built-in audio cue is acceptable for the first release of this feature.
- Existing calibration robustness principles (neutral offset, noise filtering, stability checks) remain in scope and are refined, not replaced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In validation sessions, 100% of tested isometric and isotonic exercises require a visible release before the next repetition begins counting.
- **SC-002**: In validation sessions, 100% of completed repetitions trigger exactly one completion audio cue.
- **SC-003**: In test sessions for brow and eyes-closed exercises after calibration, at least 90% of users can complete at least one full repetition per configured exercise without manual threshold overrides.
- **SC-004**: During calibration stress tests with injected spikes, baseline values remain within clinically expected ranges and do not show single-frame outlier dominance.
