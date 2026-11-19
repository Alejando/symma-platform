import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { ProgressChart, buildPlottedPoints, getSelectedSessions } from "./ProgressChart";

describe("getSelectedSessions", () => {
  const sessions = [
    { id: "s1", date: "2026-02-20", score: 80, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 80 }] },
    { id: "s2", date: "2026-02-21", score: 82, durationSeconds: 650, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 82 }] },
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
    { id: "s3", date: "2026-02-22T10:00:00.000Z", score: 90, durationSeconds: 600, color: "#F59E0B", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 14, averageAccuracy: 90 }] },
    { id: "s2", date: "2026-02-21T10:00:00.000Z", score: 70, durationSeconds: 600, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 70 }] },
    { id: "s1", date: "2026-02-20T10:00:00.000Z", score: 50, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 50 }] },
  ];

  it("plots the full score history from chartData with the oldest session first", () => {
    const points = buildPlottedPoints({
      data: [
        { date: "2026-02-22", score: 90 },
        { date: "2026-01-05", score: 30 },
        { date: "2026-02-20", score: 50 },
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
});

describe("ProgressChart", () => {
  it("renders chart container with title", () => {
    renderWithIntl(
      <ProgressChart
        data={[
          { date: "2026-02-20", score: 80 },
          { date: "2026-02-21", score: 82 },
        ]}
        sessions={[
          { id: "s1", date: "2026-02-20", score: 80, durationSeconds: 600, color: "#0D9488", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 10, averageAccuracy: 80 }] },
          { id: "s2", date: "2026-02-21", score: 82, durationSeconds: 650, color: "#6366F1", items: [{ exerciseId: "e1", exerciseName: "Smile", repsCompleted: 12, averageAccuracy: 82 }] },
        ]}
        selectedIds={new Set(["s2"])}
      />
    );

    expect(screen.getByText("Tendencia de rendimiento")).toBeInTheDocument();
  });
});
