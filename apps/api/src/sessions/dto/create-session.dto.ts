import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type {
  CreateSessionRequest,
  SessionCalibration,
  SessionItemRequest,
} from '@symma/shared-types';
import { IsOnOrAfter } from '../../common/validators/is-on-or-after.validator';
import { IsNumberRecord } from '../../common/validators/is-number-record.validator';

export class SessionCalibrationDto implements SessionCalibration {
  @ApiProperty()
  @IsISO8601()
  capturedAt: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  @IsNumberRecord()
  values: Record<string, number>;
}

export class SessionItemDto implements SessionItemRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  repsCompleted: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  averageAccuracy?: number;

  @ApiProperty({
    required: false,
    minimum: 0,
    maximum: 100,
    description: 'Left/right facial symmetry, 100 = perfectly symmetric',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  symmetryScore?: number;

  @ApiProperty({ required: false, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageHoldSeconds?: number;

  @ApiProperty({
    required: false,
    description: 'Key returned by POST /mobile/snapshots/upload-url',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  snapshotKey?: string;

  @ApiProperty({ required: false, description: 'Detailed series data' })
  @IsOptional()
  seriesData?: unknown;
}

export class CreateSessionDto implements CreateSessionRequest {
  @ApiProperty({ description: 'Client-generated UUID for idempotency' })
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  routineId: string;

  @ApiProperty()
  @IsISO8601()
  startTime: string;

  @ApiProperty()
  @IsISO8601()
  @IsOnOrAfter('startTime')
  endTime: string;

  @ApiProperty({ required: false, type: SessionCalibrationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SessionCalibrationDto)
  calibration?: SessionCalibrationDto;

  @ApiProperty({ type: [SessionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SessionItemDto)
  items: SessionItemDto[];
}
