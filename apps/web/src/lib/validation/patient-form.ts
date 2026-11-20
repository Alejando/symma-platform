import { z } from 'zod';
import { parseISO, startOfDay } from 'date-fns';

const LOCAL_PHONE_DIGITS = 10;

const optionalPhone = z
  .string()
  .refine((value) => value === '' || value.replace(/\D/g, '').length === LOCAL_PHONE_DIGITS, 'phoneDigits');

export const patientFormSchema = z.object({
  firstName: z.string().trim().min(1, 'firstNameRequired'),
  lastName: z.string().trim().min(1, 'lastNameRequired'),
  email: z.string().trim().min(1, 'emailRequired').pipe(z.email('invalidEmail')),
  dateOfBirth: z
    .string()
    .min(1, 'dateOfBirthRequired')
    .refine((value) => parseISO(value) <= startOfDay(new Date()), 'pastDate'),
  gender: z.string(),
  phoneNumber: optionalPhone,
  diagnosis: z.string(),
  initialParalysisDegree: z.string(),
  clinicalNotes: z.string(),
  emergencyContactName: z.string(),
  emergencyContactPhone: optionalPhone,
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
