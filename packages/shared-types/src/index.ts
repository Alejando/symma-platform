// ==========================================
// Enums
// ==========================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Role = 'ADMIN' | 'THERAPIST';

// ==========================================
// Entities
// ==========================================

export interface Patient {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  gender?: Gender;
  phoneNumber?: string;
  email: string;
  status: PatientStatus;
  diagnosis?: string;
  initialParalysisDegree?: number;
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Therapist {
  id: string;
  clinicId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// DTOs
// ==========================================

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender?: Gender;
  phoneNumber?: string;
  diagnosis?: string;
  initialParalysisDegree?: number;
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: PatientStatus;
}

// ==========================================
// API Response Types
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ==========================================
// Routine Types
// ==========================================

// ==========================================
// Routine Types
// ==========================================

export enum ExerciseType {
  ISOTONIC = 'ISOTONIC',
  ISOMETRIC = 'ISOMETRIC',
  MANUAL = 'MANUAL',
  RELAXATION = 'RELAXATION'
}

export const MOBILE_SUPPORTED_TYPES: ExerciseType[] = [
  ExerciseType.ISOTONIC,
  ExerciseType.ISOMETRIC,
];

export enum MobileModule {
  EYES = 'EYES',
  EYES_INVERSE = 'EYES_INVERSE',
  BROWS = 'BROWS',
  JAW = 'JAW',
  SMILE = 'SMILE',
  KISS = 'KISS'
}

export type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';

export interface Exercise {
  id: string;
  keyName: string;
  name: string;
  description?: string;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
  defaultConfig?: { threshold?: number; holdTime?: number; restTime?: number };
  createdAt: string;
}

export interface RoutineItem {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;

  // RFC-030 Configuration
  sets: number;
  repsPerSet: number;
  targetHoldSeconds: number;
  difficultyLevel: number;
  restBetweenSets: number;
  strictMode: boolean;
  allowSkip: boolean;

  exercise?: Exercise;
}

export type RoutineStatus = 'ACTIVE' | 'ARCHIVED';

export interface Routine {
  id: string;
  patientId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: RoutineStatus;
  therapistNotes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  items?: RoutineItem[];
  sessionsCount?: number;
}

export interface CreateRoutineItemDto {
  exerciseId: string;
  sets: number;
  repsPerSet: number;
  targetHoldSeconds: number;
  difficultyLevel?: number;
  restBetweenSets?: number;
  strictMode?: boolean;
  allowSkip?: boolean;
}

export interface CreateRoutineDto {
  patientId: string;
  name: string;
  startDate: string;
  endDate?: string;
  therapistNotes?: string;
  items: CreateRoutineItemDto[];
}

export interface UpdateRoutineDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  therapistNotes?: string;
  items?: CreateRoutineItemDto[];
}