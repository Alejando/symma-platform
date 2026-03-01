import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoutineDto } from './create-routine.dto';

export class UpdateRoutineItemDto {
  @IsOptional()
  @IsUUID()
  id?: string; // Existing item ID (for update), undefined for new items

  @IsString()
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

export class UpdateRoutineDto extends PartialType(
  OmitType(CreateRoutineDto, ['items', 'patientId'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRoutineItemDto)
  items?: UpdateRoutineItemDto[];
}
