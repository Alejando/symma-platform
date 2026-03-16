import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoutineAnalyticsPage from "./page";

const mockGetRoutineStats = vi.fn();
const mockGetRoutineHistory = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1", routineId: "routine-1" }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        accessToken: "token",
      },
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  getRoutineStats: (...args: unknown[]) => mockGetRoutineStats(...args),
  getRoutineHistory: (...args: unknown[]) => mockGetRoutineHistory(...args),
}));

vi.mock("@/components/analytics/RoutineStatsCards", () => ({
  RoutineStatsCards: () => <div>stats</div>,
}));

vi.mock("@/components/analytics/ProgressChart", () => ({
  ProgressChart: () => <div>chart</div>,
}));

describe("RoutineAnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetRoutineStats.mockResolvedValue({
      summary: {
        totalSessions: 1,
        avgScore: 80,
        avgDurationSeconds: 600,
      },
      chartData: [],
    });

    mockGetRoutineHistory.mockResolvedValue([
      {
        id: "session-123",
        date: "2026-02-22T10:00:00.000Z",
        durationSeconds: 900,
        score: 85,
        isSynced: true,
        items: [],
      },
    ]);
  });

  it("builds absolute session detail links including patient and routine ids", async () => {
    render(<RoutineAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTitle("View Details")).toHaveAttribute(
        "href",
        "/dashboard/patients/patient-1/routines/routine-1/sessions/session-123",
      );
    });
  });
});
