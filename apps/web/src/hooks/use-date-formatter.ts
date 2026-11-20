import { useMemo } from 'react';
import { useFormatter } from 'next-intl';
import { parseISO } from 'date-fns';

/**
 * Date-only values such as "1990-05-01" are parsed as local midnight so they
 * are not shifted to the previous day in time zones behind UTC.
 * Routine start and end dates arrive as the chosen calendar day at UTC midnight,
 * so `calendarDate` reads them in UTC for the same reason.
 */
export function useDateFormatter() {
  const format = useFormatter();

  return useMemo(
    () => ({
      mediumDate: (value: string) => format.dateTime(parseISO(value), { dateStyle: 'medium' }),
      calendarDate: (value: string) =>
        format.dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'UTC' }),
      longDate: (value: string) => format.dateTime(parseISO(value), { dateStyle: 'long' }),
      dateAndTime: (value: string) =>
        format.dateTime(parseISO(value), { dateStyle: 'long', timeStyle: 'short' }),
      dayAndMonth: (value: string) => format.dateTime(parseISO(value), { day: '2-digit', month: '2-digit' }),
    }),
    [format],
  );
}
