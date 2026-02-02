import { IsString, IsNotEmpty, IsISO8601, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SessionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @ApiProperty()
  @IsNumber()
  repsCompleted: number;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @ApiProperty({ required: false, description: 'Average symmetry score (0-100)' })
  @IsNumber()
  @IsOptional()
  averageAccuracy?: number;

  @ApiProperty({ required: false, description: 'Detailed series data' })
  @IsOptional()
  seriesData?: any; // Using any for JSON flexibility, or create nested DTO
}

export class CreateSessionDto {
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
