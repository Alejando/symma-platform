import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';
import { ApiError } from '@/lib/errors';
import { PatientQuickStats } from './patient-quick-stats';

const mockGetPatientStats = vi.fn();

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getPatientStats: (...args: unknown[]) => mockGetPatientStats(...args),
}));

describe('PatientQuickStats', () => {
  beforeEach(() => {
    mockGetPatientStats.mockReset();
  });

  it('shows the adherence, session count and last session reported by the API', async () => {
    mockGetPatientStats.mockResolvedValue({
      adherencePercent: 64,
      sessionsCompleted: 9,
      lastSessionAt: '2026-11-15T10:00:00.000Z',
    });

    renderWithIntl(<PatientQuickStats patientId="patient-1" />);

    expect(await screen.findByText('64%')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('15 nov 2026')).toBeInTheDocument();
    expect(mockGetPatientStats).toHaveBeenCalledWith('patient-1');
  });

  it('says there is no data instead of inventing values', async () => {
    mockGetPatientStats.mockResolvedValue({ adherencePercent: null, sessionsCompleted: 0, lastSessionAt: null });

    renderWithIntl(<PatientQuickStats patientId="patient-1" />);

    expect(await screen.findByText('Sin rutina activa')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay sesiones')).toBeInTheDocument();
    expect(screen.queryByText('85%')).not.toBeInTheDocument();
  });

  it('shows the error when the stats cannot be loaded', async () => {
    mockGetPatientStats.mockRejectedValue(new ApiError(404, 'Paciente no encontrado'));

    renderWithIntl(<PatientQuickStats patientId="patient-1" />);

    expect(await screen.findByText('Paciente no encontrado')).toBeInTheDocument();
  });
});
