import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoutineDto } from './create-routine.dto';

export class UpdateRoutineItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

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
  @IsNumber()
  @Min(0)
  difficultyLevel?: number;

  @IsOptional()
  @IsBoolean()
  strictMode?: boolean;

  @IsOptional()
  @IsBoolean()
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
