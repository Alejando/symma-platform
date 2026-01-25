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
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoutineItemDto {
  @IsUUID()
  @IsNotEmpty()
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

export class CreateRoutineDto {
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
