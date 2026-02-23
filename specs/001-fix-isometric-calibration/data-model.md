# Data Model: Isometric Release and Calibration Reliability

**Branch**: `001-fix-isometric-calibration` | **Date**: 2026-02-20

This model describes runtime/domain entities affected by the feature. It reuses existing structures and adds no mandatory DB schema changes.

## 1) RepCycle

RepCycle represents repetition progression for both ISOMETRIC and ISOTONIC exercises.

### Fields

- `exerciseType`: enum (`ISOMETRIC`, `ISOTONIC`)
- `repIndex`: int (1..N)
- `targetReached`: boolean
- `awaitingRelease`: boolean
- `holdAccumulatedMs`: long (isometric only)
- `engageThreshold`: float (default 1.0 for score-normalized target)
- `releaseThreshold`: float (strictly lower than engage threshold)

### Validation Rules

- `releaseThreshold < engageThreshold`
- `repIndex` increments only after completion criteria
- when `awaitingRelease = true`, next-rep progression is blocked

### State Transitions

1. `IDLE -> ACTIVE_REP`
2. `ACTIVE_REP -> REP_COMPLETED` (criteria met)
3. `REP_COMPLETED -> AWAITING_RELEASE` (if more reps remain)
4. `AWAITING_RELEASE -> ACTIVE_REP` (only after relax/release + re-engage)

## 2) RepFeedbackEvent

One-shot event emitted by player state machine.

### Fields

- `type`: enum (`PlayTick`, `PlayDing`, `PlaySuccess`)
- `timestamp`: instant (logical emission time)
- `repIndex`: optional int (for `PlayDing`)

### Validation Rules

- exactly one `PlayDing` per completed rep
- no `PlayDing` while rep incomplete

## 3) CalibrationStepCapture

Per-step capture state for calibration robustness.

### Fields

- `step`: enum (`Smile`, `BrowRaise`, `Kiss`, `JawOpen`, `EyesClosed`)
- `isHeadStable`: boolean
- `rawValue`: float
- `correctedValue`: float (neutral-offset adjusted)
- `minGestureThreshold`: float (step-specific)
- `validSampleCount`: int
- `requiredSampleCount`: int
- `minValidSamples`: int
- `samples`: list<float>

### Validation Rules

- only stable frames can be counted as valid
- only samples above `minGestureThreshold` are valid
- step cannot finalize unless `validSampleCount >= minValidSamples`

### Step Metric Alignment

- `BrowRaise`: capture metric must match runtime scoring inputs
- `EyesClosed`: threshold calibrated for achievable closure effort

## 4) CalibrationBaselineProfile

Output profile used by exercise scoring.

### Fields

- `mouthSmileMax`, `browRaiseMax`, `duckFaceMax`, `mouthOpenMax`, `eyesClosedMax`
- `neutralOffsets: Map<String, Float>`

### Rules

- active max values are derived from noise-resistant sample processing
- baseline update is atomic per completed step sequence

## 5) API Contract Touchpoints (Compatibility)

No required breaking changes.

Potential optional extensions (only if remote configurability is needed):

- `RoutineItem` optional fields:
  - `releaseThreshold?: number`
  - `engageThreshold?: number`

These are additive and backward-compatible.
