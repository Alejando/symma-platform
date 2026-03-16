# Quickstart: Isometric Release and Calibration Reliability

**Branch**: `001-fix-isometric-calibration` | **Date**: 2026-02-20

## Objective

Validate that:

1. Isometric and isotonic repetitions require relax/release before counting next rep.
2. A rep-complete sound is emitted exactly once per completed rep.
3. BrowRaise and EyesClosed calibration produce usable thresholds under noisy conditions.

## 1) Prerequisites

- Mobile app compiles in current branch.
- Seeded routine includes ISOMETRIC and ISOTONIC exercises.
- Camera permission granted.

## 2) Run app and tests

```bash
# From repo root
pnpm test --filter=mobile

# Optional: build mobile module
pnpm --filter=mobile build
```

## 3) Manual validation checklist

### A. Isometric release gating

1. Start an isometric exercise (e.g., smile hold 5s).
2. Complete first rep and keep gesture active.
3. Confirm next rep does not progress until patient relaxes.
4. Relax then re-engage gesture.
5. Confirm next rep starts only after re-engagement.

Expected: no consecutive auto-count without release.

### B. Isotonic release gating

1. Start an isotonic exercise.
2. Trigger one successful rep.
3. Keep gesture active continuously.
4. Confirm next rep does not count until relax + re-engage.

Expected: same release rule as isometric.

### C. Rep completion sound

1. Complete any rep.
2. Verify one completion sound is played.
3. Verify no extra completion sound while rep is not complete.

Expected: exactly one completion cue per rep.

### D. Calibration robustness (brows/eyes)

1. Run calibration and complete BrowRaise and EyesClosed steps.
2. Introduce mild movement/noise while calibrating.
3. Confirm unstable/insufficient samples do not finalize a bad step.
4. Complete calibration and start related exercises.
5. Confirm at least one repetition is realistically reachable.

Expected: calibration does not overfit to spikes and remains clinically achievable.

## 4) Contract/API compatibility checks

- Confirm mobile can still parse `/mobile/routine/active` without mandatory new fields.
- Confirm `/sessions` payload remains valid with existing fields.
- If optional thresholds are returned by API, verify defaults still apply when absent.

## 5) Legacy cleanup rule during implementation

- Remove legacy paths only if:
  1. no references remain, and
  2. equivalent behavior is covered by tests.

If not proven safe, keep legacy code and defer cleanup to a dedicated task.
