import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';
import { SessionHistoryTable } from './SessionHistoryTable';

const mockGetRoutineHistory = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getRoutineHistory: (...args: unknown[]) => mockGetRoutineHistory(...args),
}));

function historySession(id: string) {
  return { id, date: '2026-11-10T10:00:00.000Z', durationSeconds: 600, score: 80, isSynced: true, items: [] };
}

describe('SessionHistoryTable', () => {
  beforeEach(() => {
    mockGetRoutineHistory.mockReset();
    mockGetRoutineHistory.mockImplementation((_routineId: string, { page }: { page: number }) =>
      Promise.resolve({
        data: [historySession(`session-page-${page}`)],
        total: 45,
        page,
        limit: 20,
      }),
    );
  });

  it('lets the therapist walk the whole session history page by page', async () => {
    renderWithIntl(<SessionHistoryTable patientId="patient-1" routineId="routine-1" />);

    expect(await screen.findByText('Mostrando 1 a 20 de 45 resultados')).toBeInTheDocument();
    expect(mockGetRoutineHistory).toHaveBeenLastCalledWith('routine-1', { page: 1, limit: 20 });

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(mockGetRoutineHistory).toHaveBeenLastCalledWith('routine-1', { page: 2, limit: 20 }));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByTitle('Ver detalles')).toHaveAttribute(
      'href',
      '/dashboard/patients/patient-1/routines/routine-1/sessions/session-page-2',
    );
    expect(screen.queryByText(/sesiones más recientes/)).not.toBeInTheDocument();
  });
});
