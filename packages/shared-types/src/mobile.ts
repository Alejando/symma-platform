// Mobile contracts — active routine response

import type { ExerciseType, ExerciseCategory, MobileModule, RoutineStatus } from './enums';

export interface ActiveRoutineExerciseResponse {
  id: string;
  name: string;
  keyName: string;
  description: string | null;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule: MobileModule | null;
  assetAnimationUrl: string | null;
  assetTutorialVideoUrl: string | null;
}

export interface ActiveRoutineItemResponse {
  id: string;
  orderIndex: number;
  sets: number;                   // canonical name (was targetSets)
  repsPerSet: number;             // canonical name (was targetRepetitions)
  targetHoldSeconds: number;      // canonical name (was holdTimeSeconds)
  restBetweenSets: number;        // canonical name (was restBetweenSetsSeconds)
  difficultyLevel: number;
  strictMode: boolean;
  exercise: ActiveRoutineExerciseResponse;
}

export interface ActiveRoutineResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: RoutineStatus;
  items: ActiveRoutineItemResponse[];
}
