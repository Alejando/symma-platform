import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/errors';
import { renderWithIntl } from '@/test/render-with-intl';
import { PatientDialog } from './patient-dialog';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/^Nombre \*/), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByLabelText(/^Apellido/), { target: { value: 'López' } });
  fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByLabelText(/^Fecha de nacimiento/), { target: { value: '1990-05-01' } });
}

describe('PatientDialog', () => {
  it('keeps the form open with its data and shows the error when saving fails', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'El correo ya está registrado'));

    renderWithIntl(<PatientDialog isOpen onClose={onClose} onSubmit={onSubmit} />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar paciente' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Nombre \*/)).toHaveValue('Ana');
  });
});
