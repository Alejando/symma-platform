// Exercise contracts — CRUD operations

import type { ExerciseType, ExerciseCategory, MobileModule } from './enums';

export interface ExerciseDefaultConfig {
  threshold?: number;    // float, 0–1
  holdTime?: number;     // int, seconds
  restTime?: number;     // int, seconds
}

export interface CreateExerciseRequest {
  keyName: string;
  name: string;
  description?: string;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
  defaultConfig?: ExerciseDefaultConfig;
}

export interface UpdateExerciseRequest {
  keyName?: string;
  name?: string;
  description?: string;
  type?: ExerciseType;
  category?: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
  defaultConfig?: ExerciseDefaultConfig;
}

export interface ExerciseResponse {
  id: string;
  keyName: string;
  name: string;
  description: string | null;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule: MobileModule | null;
  assetAnimationUrl: string | null;
  assetTutorialVideoUrl: string | null;
  defaultConfig: ExerciseDefaultConfig | null;
  createdAt: string;
}
