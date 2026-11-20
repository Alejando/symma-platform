import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PATIENT_JWT_STRATEGY } from './auth.constants';

@Injectable()
export class PatientJwtAuthGuard extends AuthGuard(PATIENT_JWT_STRATEGY) {}
