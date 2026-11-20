import type { Patient } from '@prisma/client';
import type { PatientResponse } from '@symma/shared-types';

export type PublicPatient = Omit<Patient, 'accessCodeHash'>;

export function toPatientResponse(patient: PublicPatient): PatientResponse {
  return {
    id: patient.id,
    therapistId: patient.therapistId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth?.toISOString().split('T')[0] ?? null,
    gender: patient.gender,
    phoneNumber: patient.phoneNumber,
    email: patient.email,
    status: patient.status,
    diagnosis: patient.diagnosis,
    initialParalysisDegree: patient.initialParalysisDegree,
    clinicalNotes: patient.clinicalNotes,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
  };
}
