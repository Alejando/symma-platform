import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/errors';
import { renderWithIntl } from '@/test/render-with-intl';
import ExercisesPage from './page';

const mockGetExercises = vi.fn();
const mockDeleteExercise = vi.fn();
const mockUpdateExercise = vi.fn();
let mockRole = 'ADMIN';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: { user: { id: 'therapist-1', name: 'Ana', email: 'ana@clinic.test', role: mockRole } } }),
}));

vi.mock('@/lib/api', () => ({
  getExercises: (...args: unknown[]) => mockGetExercises(...args),
  deleteExercise: (...args: unknown[]) => mockDeleteExercise(...args),
  updateExercise: (...args: unknown[]) => mockUpdateExercise(...args),
  createExercise: vi.fn(),
}));

const exerciseInUse = {
  id: 'exercise-1',
  keyName: 'smile_stretch',
  name: 'Estiramiento de sonrisa',
  description: null,
  type: 'ISOMETRIC',
  category: 'CORE',
  mobileModule: 'SMILE',
  assetAnimationUrl: null,
  assetTutorialVideoUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const conflictMessage = 'El ejercicio forma parte de una rutina activa';

describe('ExercisesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ADMIN';
    vi.stubGlobal('confirm', () => true);
    mockGetExercises.mockResolvedValue({ data: [exerciseInUse], total: 1, page: 1, limit: 20 });
  });

  it('shows the reason returned by the API when an exercise cannot be deleted', async () => {
    mockDeleteExercise.mockRejectedValue(new ApiError(409, conflictMessage));

    renderWithIntl(<ExercisesPage />);
    const row = (await screen.findAllByText('Estiramiento de sonrisa'))[0].closest('tr')!;
    fireEvent.click(within(row).getByTitle('Eliminar'));

    expect(await screen.findByRole('alert')).toHaveTextContent(conflictMessage);
    expect(screen.getAllByText('Estiramiento de sonrisa').length).toBeGreaterThan(0);
  });

  it('keeps the edit dialog open with the reason returned by the API when an update is rejected', async () => {
    mockUpdateExercise.mockRejectedValue(new ApiError(409, conflictMessage));

    renderWithIntl(<ExercisesPage />);
    const row = (await screen.findAllByText('Estiramiento de sonrisa'))[0].closest('tr')!;
    fireEvent.click(within(row).getByTitle('Editar'));
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(conflictMessage);
    expect(screen.getByText('Editar ejercicio')).toBeInTheDocument();
  });

  it('shows the translated reason when the API refuses the change with a 403', async () => {
    const forbiddenMessage = 'Solo un administrador puede modificar el catálogo global';
    mockDeleteExercise.mockRejectedValue(new ApiError(403, forbiddenMessage));

    renderWithIntl(<ExercisesPage />);
    const row = (await screen.findAllByText('Estiramiento de sonrisa'))[0].closest('tr')!;
    fireEvent.click(within(row).getByTitle('Eliminar'));

    expect(await screen.findByRole('alert')).toHaveTextContent(forbiddenMessage);
  });

  it('shows the catalog read-only to therapists who are not administrators', async () => {
    mockRole = 'THERAPIST';

    renderWithIntl(<ExercisesPage />);

    expect((await screen.findAllByText('Estiramiento de sonrisa')).length).toBeGreaterThan(0);
    expect(
      screen.getByText('El catálogo de ejercicios es global: solo un administrador puede crear, editar o eliminar ejercicios.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agregar ejercicio/ })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar/ })).not.toBeInTheDocument();
  });
});
