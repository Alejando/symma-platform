// Patient contracts — CRUD operations and access codes
//
// DEPRECATION EXAMPLE (for reference — do not use in production):
// -------------------------------------------------------------
// /**
//  * @deprecated Since v1.2.0 — use `phoneNumber` instead. Will be removed in v2.0.0
//  */
// phone?: string;
// -------------------------------------------------------------

import type { Gender, PatientStatus } from './enums';

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;                 // YYYY-MM-DD
  gender?: Gender;
  phoneNumber?: string;
  diagnosis?: string;
  initialParalysisDegree?: number;     // int, 1–6 (House-Brackmann)
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;                // YYYY-MM-DD
  gender?: Gender;
  phoneNumber?: string;
  status?: PatientStatus;
  diagnosis?: string;
  initialParalysisDegree?: number;     // int, 1–6
  clinicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientResponse {
  id: string;
  therapistId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;          // YYYY-MM-DD or null
  gender: Gender | null;
  phoneNumber: string | null;
  email: string | null;
  status: PatientStatus;
  diagnosis: string | null;
  initialParalysisDegree: number | null;
  clinicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}

export interface AccessCodeResponse {
  accessCode: string;    // plain-text 6-digit code (shown once)
  patientId: string;
}

export interface AccessCodeStatusResponse {
  hasAccessCode: boolean;
}
