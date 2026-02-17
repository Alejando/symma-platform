import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateRoutineRequest, RoutineItemRequest } from '@symma/shared-types';

export class CreateRoutineItemDto implements RoutineItemRequest {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsInt()
  @Min(1)
  sets: number;

  @IsInt()
  @Min(1)
  repsPerSet: number;

  @IsInt()
  @Min(0)
  targetHoldSeconds: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restBetweenSets?: number;

  @IsOptional()
  difficultyLevel?: number;

  @IsOptional()
  strictMode?: boolean;

  @IsOptional()
  allowSkip?: boolean;


}

export class CreateRoutineDto implements CreateRoutineRequest {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  therapistNotes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRoutineItemDto)
  items: CreateRoutineItemDto[];
}
