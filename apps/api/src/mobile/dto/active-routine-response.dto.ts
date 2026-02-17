import { ApiProperty } from '@nestjs/swagger';

export class ActiveRoutineExerciseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  keyName: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  type: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false, description: 'Mobile module for strategy selection (SMILE, BROWS, JAW, KISS, EYES, EYES_INVERSE)' })
  mobileModule: string | null;

  @ApiProperty({ required: false })
  assetAnimationUrl: string | null;

  @ApiProperty({ required: false })
  assetTutorialVideoUrl: string | null;
}

export class ActiveRoutineItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ description: 'Number of sets for this exercise' })
  sets: number;

  @ApiProperty({ description: 'Number of repetitions per set' })
  repsPerSet: number;

  @ApiProperty({ description: 'Hold time in seconds (0 for isotonic exercises)' })
  targetHoldSeconds: number;

  @ApiProperty({ description: 'Rest time between sets in seconds' })
  restBetweenSets: number;

  @ApiProperty({ description: 'Difficulty level multiplier (1.0 = normal)' })
  difficultyLevel: number;

  @ApiProperty({ description: 'Whether strict mode is enabled' })
  strictMode: boolean;

  @ApiProperty({ type: ActiveRoutineExerciseDto })
  exercise: ActiveRoutineExerciseDto;
}

export class ActiveRoutineResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ required: false })
  endDate: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [ActiveRoutineItemDto] })
  items: ActiveRoutineItemDto[];
}
