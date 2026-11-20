import { describe, expect, it } from 'vitest';
import { patientFormSchema, type PatientFormValues } from './patient-form';
import { toFieldErrors } from './field-errors';

const validPatient: PatientFormValues = {
  firstName: ' Ana ',
  lastName: 'López',
  email: 'ana@example.com',
  dateOfBirth: '1990-05-01',
  gender: '',
  phoneNumber: '555-123-4567',
  diagnosis: '',
  initialParalysisDegree: '',
  clinicalNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

function fieldErrorsOf(values: PatientFormValues) {
  const result = patientFormSchema.safeParse(values);
  return result.success ? {} : toFieldErrors(result.error, (key) => key);
}

describe('patientFormSchema', () => {
  it('accepts a valid patient and trims names', () => {
    const result = patientFormSchema.safeParse(validPatient);
    expect(result.success && result.data.firstName).toBe('Ana');
  });

  it('reports each missing required field with its catalog key', () => {
    expect(fieldErrorsOf({ ...validPatient, firstName: '', lastName: ' ', email: '', dateOfBirth: '' })).toEqual({
      firstName: 'firstNameRequired',
      lastName: 'lastNameRequired',
      email: 'emailRequired',
      dateOfBirth: 'dateOfBirthRequired',
    });
  });

  it('rejects malformed emails, incomplete phones and future birth dates', () => {
    expect(
      fieldErrorsOf({
        ...validPatient,
        email: 'ana@',
        phoneNumber: '555-123',
        emergencyContactPhone: '12',
        dateOfBirth: '2999-01-01',
      }),
    ).toEqual({
      email: 'invalidEmail',
      phoneNumber: 'phoneDigits',
      emergencyContactPhone: 'phoneDigits',
      dateOfBirth: 'pastDate',
    });
  });
});
