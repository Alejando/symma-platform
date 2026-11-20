import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Routine } from '@symma/shared-types';
import { renderWithIntl } from '@/test/render-with-intl';
import { ApiError } from '@/lib/errors';
import PatientRoutinesPage from './page';

const mockGetPatientRoutines = vi.fn();
const mockActivateRoutine = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getPatientRoutines: (...args: unknown[]) => mockGetPatientRoutines(...args),
  activateRoutine: (...args: unknown[]) => mockActivateRoutine(...args),
  cloneRoutine: vi.fn(),
  deleteRoutine: vi.fn(),
}));

function routine(overrides: Partial<Routine>): Routine {
  return {
    id: 'routine',
    patientId: 'patient-1',
    name: 'Routine',
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: null,
    status: 'ACTIVE',
    therapistNotes: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    items: [],
    ...overrides,
  };
}

const activeRoutine = routine({ id: 'active-1', name: 'Rutina de noviembre', status: 'ACTIVE' });
const draftRoutine = routine({ id: 'draft-1', name: 'Rutina de noviembre (copia)', status: 'DRAFT' });

function settledParams<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), { status: 'fulfilled', value });
}

function renderPage() {
  return renderWithIntl(<PatientRoutinesPage params={settledParams({ id: 'patient-1' })} />);
}

describe('PatientRoutinesPage drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPatientRoutines.mockResolvedValue([activeRoutine, draftRoutine]);
  });

  it('shows a cloned routine as a draft, apart from the active one', async () => {
    renderPage();

    const draftsSection = (await screen.findByRole('heading', { name: 'Borradores' })).closest('section')!;
    expect(within(draftsSection).getByText('Rutina de noviembre (copia)')).toBeInTheDocument();
    expect(within(draftsSection).getByText('Borrador')).toBeInTheDocument();
    expect(within(draftsSection).getByText('El paciente no recibe esta rutina hasta que la actives.')).toBeInTheDocument();
  });

  it('warns that activating archives the current active routine before activating', async () => {
    mockActivateRoutine.mockResolvedValue({ ...draftRoutine, status: 'ACTIVE' });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Activar/ }));

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(/La rutina activa «Rutina de noviembre» se archivará/),
    ).toBeInTheDocument();
    expect(mockActivateRoutine).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Activar y archivar la actual' }));

    await waitFor(() => expect(mockActivateRoutine).toHaveBeenCalledWith('draft-1'));
    await waitFor(() => expect(mockGetPatientRoutines).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and shows the API reason when activation is rejected', async () => {
    mockActivateRoutine.mockRejectedValue(new ApiError(409, 'La rutina ya no es un borrador'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Activar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Activar y archivar la actual' }));

    expect(await screen.findByText('La rutina ya no es un borrador')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
