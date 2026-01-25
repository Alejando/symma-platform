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

export type ExerciseType = 'AR_TRACKING' | 'MANUAL' | 'RELAXATION';

export type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';

export interface Exercise {
  id: string;
  keyName: string;
  name: string;
  description?: string;
  type: ExerciseType;
  category: ExerciseCategory;
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
  targetRepetitions: number;
  targetSets: number;
  holdTimeSeconds: number;
  successThreshold?: number;
  restBetweenSetsSeconds: number; // It is required in DB now (defaulted), but checking how API returns it. 
  // Wait, DB has @default(60), so it is INT. 
  // Prisma Client return type matches DB.
  exercise?: Exercise;
}

export interface Routine {
  id: string;
  patientId: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  therapistNotes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  items?: RoutineItem[];
}

export interface CreateRoutineItemDto {
  exerciseId: string;
  targetRepetitions: number;
  targetSets: number;
  holdTimeSeconds: number;
  restBetweenSetsSeconds?: number;
}

export interface CreateRoutineDto {
  patientId: string;
  name: string;
  startDate: string;
  endDate?: string;
  therapistNotes?: string;
  items: CreateRoutineItemDto[];
}