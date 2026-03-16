import { render, screen, fireEvent } from '@testing-library/react';
import { RoutineBuilder } from './routine-builder';
import type { ExerciseResponse, Patient } from '@symma/shared-types';
import { vi, describe, it, expect } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';

const mockTranslations = {
  ExerciseCategory: {
    CORE: 'Principal',
  },
  ExerciseType: {
    ISOMETRIC: 'Isométrico',
  },
  MobileModule: {
    SMILE: 'Sonrisa',
  }
};

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

    render(
      <NextIntlClientProvider locale="es" messages={{ enums: mockTranslations }}>
        <RoutineBuilder
          patients={[mockPatient]}
          items={[]}
          onItemsChange={setItems}
          onSubmit={handleSubmit}
          loading={false}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/Select Patient/i)).toBeInTheDocument();
    expect(screen.getByText(/Add exercises from the catalog/i)).toBeInTheDocument();
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


    render(
      <NextIntlClientProvider locale="es" messages={{ enums: mockTranslations }}>
        <RoutineBuilder
          patients={[mockPatient]}
          preSelectedPatientId="p-1"
          items={items}
          onItemsChange={setItems}
          onSubmit={handleSubmit}
          loading={false}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // sets
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // reps

  });

  // Add more tests as needed for interaction
});
