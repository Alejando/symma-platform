import type { Role } from '@symma/shared-types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface PatientJwtPayload {
  sub: string;
  role: 'PATIENT';
  firstName: string;
  credentialVersion: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface TherapistInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  clinicId: string;
}

export interface ValidatedUser {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest {
  user: ValidatedUser;
}

export interface AuthenticatedPatient {
  id: string;
  firstName: string;
  lastName: string;
}

export interface AuthenticatedPatientRequest {
  user: AuthenticatedPatient;
}
