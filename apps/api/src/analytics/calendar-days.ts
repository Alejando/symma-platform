const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Calendar days are ISO strings (YYYY-MM-DD). */
export type CalendarDay = string;

export function calendarDayIn(timeZone: string, instant: Date): CalendarDay {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function utcCalendarDay(instant: Date): CalendarDay {
  return instant.toISOString().slice(0, 10);
}

export function addDays(day: CalendarDay, days: number): CalendarDay {
  return utcCalendarDay(
    new Date(Date.parse(`${day}T00:00:00Z`) + days * MILLISECONDS_PER_DAY),
  );
}

export function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      MILLISECONDS_PER_DAY,
  );
}

/** A streak survives until the end of the day after the last practice. */
export function currentStreak(
  practicedDays: CalendarDay[],
  today: CalendarDay,
): number {
  const practiced = new Set(practicedDays);
  let day = practiced.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (practiced.has(day)) {
    streak++;
    day = addDays(day, -1);
  }

  return streak;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}
