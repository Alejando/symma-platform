import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';
import PatientsPage from './page';

const mockGetPatients = vi.fn();

let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { accessToken: 'token' } } }),
  signOut: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getPatients: (...args: unknown[]) => mockGetPatients(...args),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn(),
}));

function patient(index: number) {
  return {
    id: `patient-${index}`,
    therapistId: 'therapist-1',
    firstName: `Paciente${index}`,
    lastName: 'Prueba',
    email: `p${index}@example.com`,
    dateOfBirth: null,
    gender: null,
    phoneNumber: null,
    status: 'ACTIVE',
    diagnosis: null,
    initialParalysisDegree: null,
    clinicalNotes: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('PatientsPage', () => {
  beforeEach(() => {
    mockSearchParams = new URLSearchParams();
    mockGetPatients.mockReset();
    mockGetPatients.mockImplementation((_token: string, { page }: { page: number }) =>
      Promise.resolve({
        data: page === 1 ? Array.from({ length: 20 }, (_, index) => patient(index)) : [patient(20)],
        total: 21,
        page,
        limit: 20,
      }),
    );
  });

  it('lets the therapist reach patients beyond the first page', async () => {
    renderWithIntl(<PatientsPage />);

    expect(await screen.findByText('Mostrando 1 a 20 de 21 resultados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(mockGetPatients).toHaveBeenLastCalledWith('token', { page: 2, limit: 20, search: undefined }));
    expect(await screen.findByText('Mostrando 21 a 21 de 21 resultados')).toBeInTheDocument();
    expect(screen.getAllByText('Paciente20 Prueba').length).toBeGreaterThan(0);
  });

  it('opens the new patient form when arriving from the dashboard quick action', async () => {
    mockSearchParams = new URLSearchParams('action=new');

    renderWithIntl(<PatientsPage />);

    expect(await screen.findByText('Agregar nuevo paciente')).toBeInTheDocument();
  });

  it('shows the error instead of an empty list when loading fails', async () => {
    mockGetPatients.mockRejectedValue(new TypeError('Failed to fetch'));

    renderWithIntl(<PatientsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión a internet');
  });
});
