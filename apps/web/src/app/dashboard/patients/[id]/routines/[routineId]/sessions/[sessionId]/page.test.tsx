import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import SessionDetailPage from "./page";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockGetSessionDetail = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "patient-1", routineId: "routine-1", sessionId: "session-1" }),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
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
  getSessionDetail: (...args: unknown[]) => mockGetSessionDetail(...args),
}));

describe("SessionDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton initially", () => {
    mockGetSessionDetail.mockReturnValue(new Promise(() => undefined));

    const { container } = renderWithIntl(<SessionDetailPage />);

    expect(container.querySelector(".h-24")).toBeInTheDocument();
  });

  it("renders exercise data and disables nav buttons when no adjacent session exists", async () => {
    mockGetSessionDetail.mockResolvedValue({
      id: "session-1",
      routineId: "routine-1",
      date: "2026-02-22T10:00:00.000Z",
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      createdAt: "2026-02-22T10:15:00.000Z",
      items: [
        {
          id: "item-1",
          sessionId: "session-1",
          exerciseId: "exercise-1",
          exerciseName: "Smile Stretch",
          repsCompleted: 10,
          averageAccuracy: null,
          seriesData: null,
        },
      ],
      navigation: {
        previousSessionId: null,
        nextSessionId: null,
      },
    });

    renderWithIntl(<SessionDetailPage />);

    expect(await screen.findByText("Desglose de ejercicios")).toBeInTheDocument();
    expect(screen.getByText("Smile Stretch")).toBeInTheDocument();
    expect(screen.getByText("N/D")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sesión anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente sesión" })).toBeDisabled();
  });

  it("shows empty state when no exercise items are present", async () => {
    mockGetSessionDetail.mockResolvedValue({
      id: "session-1",
      routineId: "routine-1",
      date: "2026-02-22T10:00:00.000Z",
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      createdAt: "2026-02-22T10:15:00.000Z",
      items: [],
      navigation: {
        previousSessionId: null,
        nextSessionId: null,
      },
    });

    renderWithIntl(<SessionDetailPage />);

    expect(await screen.findByText("Sin datos de ejercicios registrados")).toBeInTheDocument();
  });

  it("shows error state and retries", async () => {
    mockGetSessionDetail.mockRejectedValue(new Error("boom"));

    renderWithIntl(<SessionDetailPage />);

    expect(await screen.findByText("No se pudo cargar la sesión")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
