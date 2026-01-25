'use client';

import { createContext, useContext } from 'react';
import type { Patient } from '@symma/shared-types';

interface PatientContextType {
  patient: Patient | null;
  loading: boolean;
  refreshPatient: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}

export { PatientContext };
