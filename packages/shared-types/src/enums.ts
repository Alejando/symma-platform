// Shared enums — single source of truth for all categorical values
// These are string union types matching Prisma enum definitions

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Role = 'ADMIN' | 'THERAPIST';

export type ExerciseType = 'ISOTONIC' | 'ISOMETRIC' | 'MANUAL' | 'RELAXATION';

export type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';

export type RoutineStatus = 'ACTIVE' | 'ARCHIVED';

export type MobileModule = 'EYES' | 'EYES_INVERSE' | 'BROWS' | 'JAW' | 'SMILE' | 'KISS';
