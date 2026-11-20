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
      calibration: null,
      items: [
        {
          id: "item-1",
          sessionId: "session-1",
          exerciseId: "exercise-1",
          exerciseName: "Smile Stretch",
          repsCompleted: 10,
          averageAccuracy: null,
          symmetryScore: 91.5,
          averageHoldSeconds: null,
          snapshotUrl: null,
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
    expect(screen.getByRole("cell", { name: "Smile Stretch" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Precisión del gesto" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Simetría facial" })).toBeInTheDocument();
    expect(screen.getByText("91,5%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sesión anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente sesión" })).toBeDisabled();
  });

  it("shows average hold, best-attempt snapshot and the calibration sent with the session", async () => {
    mockGetSessionDetail.mockResolvedValue({
      id: "session-1",
      routineId: "routine-1",
      date: "2026-02-22T10:00:00.000Z",
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      createdAt: "2026-02-22T10:15:00.000Z",
      calibration: {
        capturedAt: "2026-02-22T09:55:00.000Z",
        values: { smileMax: 0.8123, browRaiseMax: 0.45 },
      },
      items: [
        {
          id: "item-1",
          sessionId: "session-1",
          exerciseId: "exercise-1",
          exerciseName: "Sonrisa",
          repsCompleted: 10,
          averageAccuracy: 82,
          symmetryScore: 76,
          averageHoldSeconds: 4.25,
          snapshotUrl: "https://storage.test/snapshots/item-1.jpg?signature=abc",
          seriesData: null,
        },
        {
          id: "item-2",
          sessionId: "session-1",
          exerciseId: "exercise-2",
          exerciseName: "Cejas",
          repsCompleted: 8,
          averageAccuracy: 70,
          symmetryScore: null,
          averageHoldSeconds: null,
          snapshotUrl: null,
          seriesData: null,
        },
      ],
      navigation: { previousSessionId: null, nextSessionId: null },
    });

    renderWithIntl(<SessionDetailPage />);

    expect(await screen.findByRole("columnheader", { name: "Sostenimiento promedio" })).toBeInTheDocument();
    expect(screen.getByText("4,3 s")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Captura del mejor intento en Sonrisa" })).toHaveAttribute(
      "src",
      "https://storage.test/snapshots/item-1.jpg?signature=abc",
    );
    expect(screen.getByText("Sin captura del mejor intento")).toBeInTheDocument();
    expect(screen.getByText("Calibración enviada con la sesión")).toBeInTheDocument();
    expect(screen.getByText("smileMax")).toBeInTheDocument();
    expect(screen.getByText("0,812")).toBeInTheDocument();
  });

  it("falls back to the empty state when the signed snapshot link no longer loads", async () => {
    mockGetSessionDetail.mockResolvedValue({
      id: "session-1",
      routineId: "routine-1",
      date: "2026-02-22T10:00:00.000Z",
      durationSeconds: 900,
      score: 85,
      isSynced: true,
      createdAt: "2026-02-22T10:15:00.000Z",
      calibration: null,
      items: [
        {
          id: "item-1",
          sessionId: "session-1",
          exerciseId: "exercise-1",
          exerciseName: "Sonrisa",
          repsCompleted: 10,
          averageAccuracy: 82,
          symmetryScore: 76,
          averageHoldSeconds: 4,
          snapshotUrl: "https://storage.test/expired.jpg",
          seriesData: null,
        },
      ],
      navigation: { previousSessionId: null, nextSessionId: null },
    });

    renderWithIntl(<SessionDetailPage />);

    fireEvent.error(await screen.findByRole("img", { name: "Captura del mejor intento en Sonrisa" }));

    expect(
      await screen.findByText("No se pudo cargar la captura; recarga la página para obtener un enlace nuevo."),
    ).toBeInTheDocument();
    expect(screen.getByText("Esta sesión no incluye datos de calibración.")).toBeInTheDocument();
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
      calibration: null,
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
