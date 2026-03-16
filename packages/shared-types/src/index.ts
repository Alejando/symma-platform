// Barrel re-export — all contracts from domain-specific files
// This file maintains backward compatibility while organizing types by domain

// Enums
export * from './enums';

// Common (pagination, errors)
export * from './common';

// Domain contracts
export * from './auth';
export * from './patients';
export * from './routines';
export * from './exercises';
export * from './sessions';
export * from './mobile';
export * from './analytics';
export * from './dashboard';

// ==========================================
// Legacy Aliases (for backward compatibility)
// These will be deprecated in future versions
// ==========================================

// Legacy entity types — use PatientResponse, RoutineResponse, ExerciseResponse instead
export type { PatientResponse as Patient } from './patients';
export type { RoutineResponse as Routine } from './routines';
export type { RoutineItemResponse as RoutineItem } from './routines';
export type { ExerciseResponse as Exercise } from './exercises';

// Legacy DTO aliases — use CreatePatientRequest, UpdatePatientRequest instead
export type { CreatePatientRequest as CreatePatientDto } from './patients';
export type { UpdatePatientRequest as UpdatePatientDto } from './patients';
export type { CreateRoutineRequest as CreateRoutineDto } from './routines';
export type { UpdateRoutineRequest as UpdateRoutineDto } from './routines';
export type { RoutineItemRequest as CreateRoutineItemDto } from './routines';

// Legacy Therapist type (not yet in new contracts — keeping for compatibility)
export interface Therapist {
  id: string;
  clinicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'THERAPIST';
  isActive: boolean;
  createdAt: string;
}