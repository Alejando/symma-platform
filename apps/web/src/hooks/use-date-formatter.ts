import { useMemo } from 'react';
import { useFormatter } from 'next-intl';
import { parseISO } from 'date-fns';

/**
 * Date-only values such as "1990-05-01" are parsed as local midnight so they
 * are not shifted to the previous day in time zones behind UTC.
 */
export function useDateFormatter() {
  const format = useFormatter();

  return useMemo(
    () => ({
      mediumDate: (value: string) => format.dateTime(parseISO(value), { dateStyle: 'medium' }),
      longDate: (value: string) => format.dateTime(parseISO(value), { dateStyle: 'long' }),
      dayAndMonth: (value: string) => format.dateTime(parseISO(value), { day: '2-digit', month: '2-digit' }),
    }),
    [format],
  );
}
