import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import type {
  CreateExerciseRequest,
  ExerciseType,
  ExerciseCategory,
  MobileModule,
} from '@symma/shared-types';

const EXERCISE_TYPE_VALUES: ExerciseType[] = [
  'ISOTONIC',
  'ISOMETRIC',
  'MANUAL',
  'RELAXATION',
];
const EXERCISE_CATEGORY_VALUES: ExerciseCategory[] = [
  'WARMUP',
  'CORE',
  'COOLDOWN',
];
const MOBILE_MODULE_VALUES: MobileModule[] = [
  'EYES',
  'EYES_INVERSE',
  'BROWS',
  'JAW',
  'SMILE',
  'KISS',
];
const MOBILE_SUPPORTED_TYPES: ExerciseType[] = ['ISOTONIC', 'ISOMETRIC'];

export class CreateExerciseDto implements CreateExerciseRequest {
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(EXERCISE_TYPE_VALUES)
  type: ExerciseType;

  @IsIn(EXERCISE_CATEGORY_VALUES)
  category: ExerciseCategory;

  @ValidateIf((o) => o.assetAnimationUrl !== '')
  @IsUrl()
  @IsOptional()
  assetAnimationUrl?: string;

  @ValidateIf((o) => o.assetTutorialVideoUrl !== '')
  @IsUrl()
  @IsOptional()
  assetTutorialVideoUrl?: string;

  @ValidateIf((o) => MOBILE_SUPPORTED_TYPES.includes(o.type))
  @IsIn(MOBILE_MODULE_VALUES)
  @IsOptional()
  mobileModule?: MobileModule;
}
