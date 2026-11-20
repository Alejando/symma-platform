import { differenceInYears, parseISO } from 'date-fns';

export function ageInYears(dateOfBirth: string, today: Date = new Date()): number {
  return differenceInYears(today, parseISO(dateOfBirth));
}
