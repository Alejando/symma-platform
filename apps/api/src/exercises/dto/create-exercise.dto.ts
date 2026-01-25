import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import { ExerciseType, ExerciseCategory } from '@prisma/client';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ExerciseType)
  type: ExerciseType;

  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @ValidateIf((o) => o.assetAnimationUrl !== '')
  @IsUrl()
  @IsOptional()
  assetAnimationUrl?: string;

  @ValidateIf((o) => o.assetTutorialVideoUrl !== '')
  @IsUrl()
  @IsOptional()
  assetTutorialVideoUrl?: string;

  @IsOptional()
  defaultConfig?: any;
}
