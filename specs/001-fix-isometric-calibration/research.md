# Research: Isometric Release and Calibration Reliability

**Branch**: `001-fix-isometric-calibration` | **Date**: 2026-02-20

## R1: Rep gating strategy for ISOMETRIC and ISOTONIC

**Decision**: Use a shared release-gating state for both exercise types: after rep completion, require a release transition before allowing next rep progression.

**Rationale**: This directly satisfies the clarified requirement and prevents chained false repetitions when the patient keeps the gesture active.

**Alternatives considered**:
- **Isometric-only release gating**: Rejected because clarification explicitly extends behavior to isotonic.
- **Time-based fixed cooldown**: Rejected because it does not guarantee an actual relax movement.

## R2: Threshold stability (hysteresis)

**Decision**: Use distinct engage/release thresholds (hysteresis) to avoid jitter around a single boundary.

**Rationale**: Frame-level score noise near threshold can trigger unstable transitions. Hysteresis gives deterministic progression and cleaner tests.

**Alternatives considered**:
- **Single threshold for engage/release**: Rejected due to oscillation risk.
- **Heavy smoothing filter**: Rejected for introducing latency and reducing responsiveness.

## R3: Audio feedback in Player flow

**Decision**: Keep `PlayerEvent` as the event source and implement event consumption in `PlayerScreen` with lightweight local tone playback.

**Rationale**: Event model already exists; missing piece is UI consumption. This is minimal, low-risk, and does not require new infrastructure.

**Alternatives considered**:
- **Inject dedicated sound service now**: Rejected for this scope; larger refactor.
- **No audio fallback**: Rejected because per-rep cue is a requirement.

## R4: Calibration alignment for BrowRaise and EyesClosed

**Decision**: Align BrowRaise calibration metric with runtime scoring metric and add step-specific minimum intensity thresholds.

**Rationale**: Mismatched formulas and a single global threshold over-constrain some gestures and under-constrain others.

**Alternatives considered**:
- **Keep global threshold**: Rejected; fails for low-amplitude gestures.
- **Increase capture duration only**: Rejected; does not fix metric mismatch.

## R5: Sample quality gate

**Decision**: Enforce minimum valid stable samples before finalizing calibration steps; continue capture when criteria are not met.

**Rationale**: Prevents noisy/low-confidence baselines that later block repetitions.

**Alternatives considered**:
- **Finalize on elapsed time only**: Rejected due to poor reliability under unstable capture.

## R6: API contract handling

**Decision**: Reuse existing contracts as-is for current behavior changes; if threshold configuration from API is needed, add optional fields only.

**Rationale**: Current requested behavior can be implemented client-side without breaking API. Optional fields preserve backward compatibility.

**Alternatives considered**:
- **Breaking contract rename/removal**: Rejected due to high integration risk.

## R7: Legacy code policy for this feature

**Decision**: Remove legacy code only when it is proven unused by references and covered by regression tests.

**Rationale**: Keeps codebase clean while avoiding accidental behavior removal.

**Alternatives considered**:
- **Leave all legacy paths untouched**: Rejected (technical debt persists).
- **Aggressive cleanup in same change**: Rejected (scope/risk too high for clinical behavior fix).
