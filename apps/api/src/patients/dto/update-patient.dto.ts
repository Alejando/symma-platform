import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreatePatientDto } from './create-patient.dto';
import type { PatientStatus } from '@symma/shared-types';

const PATIENT_STATUS_VALUES: PatientStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
];

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @IsOptional()
  @IsIn(PATIENT_STATUS_VALUES)
  status?: PatientStatus;
}
