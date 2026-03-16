// Routine contracts — CRUD operations and routine items

import type { RoutineStatus } from './enums';
import type { PatientResponse } from './patients';
import type { ExerciseResponse } from './exercises';

export interface RoutineItemRequest {
  exerciseId: string;
  sets: number;                  // int, >= 1
  repsPerSet: number;            // int, >= 1
  targetHoldSeconds: number;     // int, >= 0
  restBetweenSets?: number;      // int, >= 0, default 10
  difficultyLevel?: number;      // float, default 1.0
  strictMode?: boolean;          // default false
  allowSkip?: boolean;           // default true
}

export interface CreateRoutineRequest {
  patientId: string;
  name: string;
  startDate: string;             // ISO 8601
  endDate?: string;              // ISO 8601
  therapistNotes?: string;
  items: RoutineItemRequest[];
}

export interface UpdateRoutineRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  therapistNotes?: string;
  items?: RoutineItemRequest[];
}

export interface RoutineItemResponse {
  id: string;
  routineId: string;
  exerciseId: string;
  orderIndex: number;            // int
  sets: number;                  // int
  repsPerSet: number;            // int
  targetHoldSeconds: number;     // int
  difficultyLevel: number;       // float
  restBetweenSets: number;       // int
  strictMode: boolean;
  allowSkip: boolean;
  exercise?: ExerciseResponse;
}

export interface RoutineResponse {
  id: string;
  patientId: string;
  name: string;
  startDate: string;             // ISO 8601
  endDate: string | null;
  status: RoutineStatus;
  therapistNotes: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: PatientResponse;
  items?: RoutineItemResponse[];
  sessionsCount?: number;        // int, computed
}
