import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoutineDto } from './create-routine.dto';

export class UpdateRoutineItemDto {
  @IsOptional()
  @IsUUID()
  id?: string; // Existing item ID (for update), undefined for new items

  @IsUUID()
  exerciseId: string;

  @IsInt()
  @Min(1)
  targetRepetitions: number;

  @IsInt()
  @Min(1)
  targetSets: number;

  @IsInt()
  @Min(0)
  holdTimeSeconds: number;
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
