// Exercise contracts — CRUD operations

import type { ExerciseType, ExerciseCategory, MobileModule } from './enums';

export interface CreateExerciseRequest {
  keyName: string;
  name: string;
  description?: string;
  type: ExerciseType;
  category: ExerciseCategory;
  mobileModule?: MobileModule;
  assetAnimationUrl?: string;
  assetTutorialVideoUrl?: string;
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
  createdAt: string;
}
