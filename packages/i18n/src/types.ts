export type Locale = 'es' | 'en';

export const locales: Locale[] = ['es', 'en'];
export const defaultLocale: Locale = 'es';

export type TranslationNamespace = 'common' | 'errors' | 'validation' | 'enums';

// Enum types based on Prisma schema
export type Role = 'ADMIN' | 'THERAPIST';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ExerciseType = 'ISOTONIC' | 'ISOMETRIC' | 'MANUAL' | 'RELAXATION';
export type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';
export type RoutineStatus = 'ACTIVE' | 'ARCHIVED';
export type MobileModule = 'EYES' | 'EYES_INVERSE' | 'BROWS' | 'JAW' | 'SMILE' | 'KISS';
