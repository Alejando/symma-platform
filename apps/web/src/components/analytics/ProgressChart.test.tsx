import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { ProgressChart, buildPlottedPoints, getSelectedSessions } from "./ProgressChart";

describe("getSelectedSessions", () => {
  const sessions = [
    { id: "s1", date: "2026-02-20", score: 80, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 80, symmetryScore: null, averageHoldSeconds: null }] },
    { id: "s2", date: "2026-02-21", score: 82, durationSeconds: 650, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 82, symmetryScore: null, averageHoldSeconds: null }] },
  ];

  it("returns all sessions when selectedIds is empty", () => {
    expect(getSelectedSessions(sessions)).toHaveLength(2);
  });

  it("returns only selected sessions", () => {
    const selected = getSelectedSessions(sessions, new Set(["s2"]));
    expect(selected).toEqual([sessions[1]]);
  });
});

describe("buildPlottedPoints", () => {
  const newestFirstSessions = [
    { id: "s3", date: "2026-02-22T10:00:00.000Z", score: 90, durationSeconds: 600, color: "#F59E0B", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 14, averageAccuracy: 90, symmetryScore: null, averageHoldSeconds: null }] },
    { id: "s2", date: "2026-02-21T10:00:00.000Z", score: 70, durationSeconds: 600, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 70, symmetryScore: null, averageHoldSeconds: null }] },
    { id: "s1", date: "2026-02-20T10:00:00.000Z", score: 50, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 50, symmetryScore: null, averageHoldSeconds: null }] },
  ];

  it("plots the full score history from chartData with the oldest session first", () => {
    const points = buildPlottedPoints({
      data: [
        { date: "2026-02-22", score: 90, symmetry: null },
        { date: "2026-01-05", score: 30, symmetry: null },
        { date: "2026-02-20", score: 50, symmetry: null },
      ],
      sessions: newestFirstSessions,
      metric: "score",
      exerciseId: "average",
    });

    expect(points.map((point) => point.date)).toEqual(["2026-01-05", "2026-02-20", "2026-02-22"]);
    expect(points.map((point) => point.value)).toEqual([30, 50, 90]);
  });

  it("orders session-based metrics with the oldest session first even when history arrives newest first", () => {
    const points = buildPlottedPoints({
      data: [],
      sessions: newestFirstSessions,
      metric: "reps",
      exerciseId: "e1",
    });

    expect(points.map((point) => point.key)).toEqual(["s1", "s2", "s3"]);
    expect(points.map((point) => point.value)).toEqual([10, 12, 14]);
  });

  it("plots routine symmetry from chartData and skips days without a symmetry measurement", () => {
    const points = buildPlottedPoints({
      data: [
        { date: "2026-02-22", score: 90, symmetry: 81 },
        { date: "2026-02-21", score: 70, symmetry: null },
        { date: "2026-02-20", score: 50, symmetry: 64 },
      ],
      sessions: newestFirstSessions,
      metric: "symmetry",
      exerciseId: "average",
    });

    expect(points.map((point) => point.date)).toEqual(["2026-02-20", "2026-02-22"]);
    expect(points.map((point) => point.value)).toEqual([64, 81]);
  });

  it("plots per-exercise symmetry separately from the gesture accuracy", () => {
    const sessions = [
      { id: "s1", date: "2026-02-20T10:00:00.000Z", score: 50, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 50, symmetryScore: 72, averageHoldSeconds: null }] },
      { id: "s2", date: "2026-02-21T10:00:00.000Z", score: 70, durationSeconds: 600, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 70, symmetryScore: 78, averageHoldSeconds: null }] },
    ];

    const symmetry = buildPlottedPoints({ data: [], sessions, metric: "symmetry", exerciseId: "e1" });
    const accuracy = buildPlottedPoints({ data: [], sessions, metric: "score", exerciseId: "e1" });

    expect(symmetry.map((point) => point.value)).toEqual([72, 78]);
    expect(accuracy.map((point) => point.value)).toEqual([50, 70]);
  });

  it("leaves out sessions without a measurement instead of plotting them as zero", () => {
    const sessions = [
      { id: "s1", date: "2026-02-20T10:00:00.000Z", score: 50, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: null, symmetryScore: null, averageHoldSeconds: null }] },
      { id: "s2", date: "2026-02-21T10:00:00.000Z", score: 70, durationSeconds: 600, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 70, symmetryScore: null, averageHoldSeconds: null }] },
    ];

    expect(buildPlottedPoints({ data: [], sessions, metric: "score", exerciseId: "e1" }).map((p) => p.key)).toEqual(["s2"]);
    expect(buildPlottedPoints({ data: [], sessions, metric: "symmetry", exerciseId: "e1" })).toEqual([]);
  });
});

describe("ProgressChart", () => {
  it("renders chart container with title", () => {
    renderWithIntl(
      <ProgressChart
        data={[
          { date: "2026-02-20", score: 80, symmetry: null },
          { date: "2026-02-21", score: 82, symmetry: null },
        ]}
        sessions={[
          { id: "s1", date: "2026-02-20", score: 80, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 80, symmetryScore: null, averageHoldSeconds: null }] },
          { id: "s2", date: "2026-02-21", score: 82, durationSeconds: 650, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 82, symmetryScore: null, averageHoldSeconds: null }] },
        ]}
        selectedIds={new Set(["s2"])}
      />
    );

    expect(screen.getByText("Tendencia de rendimiento")).toBeInTheDocument();
  });

  it("offers symmetry as its own metric, labelled apart from gesture accuracy", () => {
    renderWithIntl(<ProgressChart data={[]} />);

    expect(screen.getByRole("tab", { name: "Precisión del gesto" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Simetría facial" })).toBeInTheDocument();
    expect(screen.getByText("No hay datos registrados para esta métrica.")).toBeInTheDocument();
  });
});
