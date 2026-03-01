import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressChart, getSelectedSessions } from "./ProgressChart";

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

describe("ProgressChart", () => {
  it("renders chart container with title", () => {
    render(
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

    expect(screen.getByText("Performance Trend")).toBeInTheDocument();
  });
});
