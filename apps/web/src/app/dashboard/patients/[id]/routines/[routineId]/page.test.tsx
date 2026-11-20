import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import RoutineAnalyticsPage from "./page";

const mockGetRoutine = vi.fn();
const mockGetRoutineStats = vi.fn();
const mockGetRoutineHistory = vi.fn();
const mockGetAllRoutineHistory = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1", routineId: "routine-1" }),
}));

vi.mock("@/lib/api", () => ({
  getRoutine: (...args: unknown[]) => mockGetRoutine(...args),
  getRoutineStats: (...args: unknown[]) => mockGetRoutineStats(...args),
  getRoutineHistory: (...args: unknown[]) => mockGetRoutineHistory(...args),
  getAllRoutineHistory: (...args: unknown[]) => mockGetAllRoutineHistory(...args),
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

    mockGetRoutine.mockResolvedValue({
      id: "routine-1",
      patientId: "patient-1",
      name: "Rutina facial",
      startDate: "2026-02-01T00:00:00.000Z",
      endDate: null,
      status: "ARCHIVED",
      therapistNotes: null,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
      items: [
        {
          id: "item-1",
          routineId: "routine-1",
          exerciseId: "exercise-1",
          orderIndex: 0,
          sets: 3,
          repsPerSet: 8,
          targetHoldSeconds: 5,
          difficultyLevel: 1,
          restBetweenSets: 10,
          strictMode: false,
          allowSkip: true,
          exercise: { id: "exercise-1", name: "Elevación de cejas" },
        },
      ],
    });

    mockGetRoutineStats.mockResolvedValue({
      summary: {
        totalSessions: 1,
        avgScore: 80,
        avgDurationSeconds: 600,
      },
      chartData: [],
    });

    mockGetRoutineHistory.mockResolvedValue({
      data: [
        {
          id: "session-123",
          date: "2026-02-22T10:00:00.000Z",
          durationSeconds: 900,
          score: 85,
          isSynced: true,
          items: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });
    mockGetAllRoutineHistory.mockResolvedValue([]);
  });

  it("builds absolute session detail links including patient and routine ids", async () => {
    renderWithIntl(<RoutineAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTitle("Ver detalles")).toHaveAttribute(
        "href",
        "/dashboard/patients/patient-1/routines/routine-1/sessions/session-123",
      );
    });
  });

  it("shows the prescribed exercises, date range and status of the routine instead of fixed values", async () => {
    renderWithIntl(<RoutineAnalyticsPage />);

    expect(await screen.findByText("Elevación de cejas")).toBeInTheDocument();
    expect(screen.getByText("3 series × 8 repeticiones")).toBeInTheDocument();
    expect(screen.getByText("Archivada")).toBeInTheDocument();
    expect(screen.getByText(/Presente/)).toBeInTheDocument();
    expect(screen.queryByText("Smile Stretch")).not.toBeInTheDocument();
    expect(screen.queryByText("Jan 01 - Jan 30")).not.toBeInTheDocument();
  });
});
