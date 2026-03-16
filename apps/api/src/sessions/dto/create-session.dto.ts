import {
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type {
  CreateSessionRequest,
  SessionItemRequest,
} from '@symma/shared-types';

export class SessionItemDto implements SessionItemRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty()
  @IsNumber()
  repsCompleted: number;

  @ApiProperty({
    required: false,
    description: 'Average symmetry score (0-100)',
  })
  @IsNumber()
  @IsOptional()
  averageAccuracy?: number;

  @ApiProperty({ required: false, description: 'Detailed series data' })
  @IsOptional()
  seriesData?: unknown;
}

export class CreateSessionDto implements CreateSessionRequest {
  @ApiProperty({
    required: false,
    description: 'Client-generated UUID for idempotency',
  })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  routineId: string;

  @ApiProperty()
  @IsISO8601()
  startTime: string;

  @ApiProperty()
  @IsISO8601()
  endTime: string;

  @ApiProperty({ type: [SessionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionItemDto)
  items: SessionItemDto[];
}
