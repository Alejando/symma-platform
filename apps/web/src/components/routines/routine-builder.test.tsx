import { screen } from '@testing-library/react';
import { RoutineBuilder } from './routine-builder';
import type { ExerciseResponse, Patient } from '@symma/shared-types';
import { vi, describe, it, expect } from 'vitest';
import { renderWithIntl } from '@/test/render-with-intl';

const mockExercise: ExerciseResponse = {
  id: 'ex-1',
  keyName: 'EX001',
  name: 'Test Exercise',
  description: 'Desc',
  type: 'ISOMETRIC',
  category: 'CORE',
  mobileModule: 'SMILE',
  assetAnimationUrl: 'http://test.com',
  assetTutorialVideoUrl: 'http://test.com',
  createdAt: new Date().toISOString(),
};

const mockPatient: Patient = {
  id: 'p-1',
  therapistId: 't-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  dateOfBirth: new Date().toISOString(),
  gender: 'MALE',
  phoneNumber: null,
  status: 'ACTIVE',
  diagnosis: null,
  initialParalysisDegree: null,
  clinicalNotes: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('RoutineBuilder', () => {
  it('renders correctly with initial props', () => {
    const setItems = vi.fn();
    const handleSubmit = vi.fn();

    renderWithIntl(
        <RoutineBuilder
          patients={[mockPatient]}
          items={[]}
          onItemsChange={setItems}
          onSubmit={handleSubmit}
          loading={false}
        />
    );

    expect(screen.getByText('Seleccionar paciente')).toBeInTheDocument();
    expect(screen.getByText('Agrega ejercicios del catálogo de la izquierda')).toBeInTheDocument();
  });

  it('displays routine items with new fields', () => {
    const setItems = vi.fn();
    const handleSubmit = vi.fn();
    const items = [{
      id: 'item-1',
      exercise: mockExercise,
      sets: 3,
      repsPerSet: 10,
      targetHoldSeconds: 5,
      restBetweenSets: 60,
      difficultyLevel: 1.0,
      strictMode: false,
      allowSkip: true,

    }];


    renderWithIntl(
        <RoutineBuilder
          patients={[mockPatient]}
          preSelectedPatientId="p-1"
          items={items}
          onItemsChange={setItems}
          onSubmit={handleSubmit}
          loading={false}
        />
    );

    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // sets
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // reps

  });

  it('warns that saving a new routine replaces the active one instead of calling it a draft', () => {
    renderWithIntl(
      <RoutineBuilder patients={[mockPatient]} items={[]} onItemsChange={vi.fn()} onSubmit={vi.fn()} loading={false} />,
    );

    expect(
      screen.getByText('Al guardarla, el paciente la recibe de inmediato y su rutina activa actual pasa al historial.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Borrador')).not.toBeInTheDocument();
  });

  it('does not show the replacement warning while editing', () => {
    renderWithIntl(
      <RoutineBuilder
        patients={[mockPatient]}
        items={[]}
        onItemsChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
        mode="edit"
      />,
    );

    expect(screen.queryByText(/su rutina activa actual pasa al historial/)).not.toBeInTheDocument();
  });
});
