import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePatientDto } from './create-patient.dto';

export enum PatientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}
