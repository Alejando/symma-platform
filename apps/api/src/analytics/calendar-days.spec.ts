import {
  addDays,
  calendarDayIn,
  currentStreak,
  daysBetween,
  isValidTimeZone,
} from './calendar-days';

describe('calendar days', () => {
  it('assigns an instant to the calendar day of the time zone', () => {
    const lateEvening = new Date('2026-03-02T03:30:00Z');

    expect(calendarDayIn('UTC', lateEvening)).toBe('2026-03-02');
    expect(calendarDayIn('America/Mexico_City', lateEvening)).toBe(
      '2026-03-01',
    );
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysBetween('2026-02-25', '2026-03-01')).toBe(4);
  });

  it('validates IANA time zones', () => {
    expect(isValidTimeZone('America/Mexico_City')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });

  describe('currentStreak', () => {
    it('counts consecutive calendar days ending today', () => {
      expect(
        currentStreak(['2026-03-01', '2026-03-02', '2026-03-03'], '2026-03-03'),
      ).toBe(3);
    });

    it('still counts when the last practice was yesterday', () => {
      expect(currentStreak(['2026-03-01', '2026-03-02'], '2026-03-03')).toBe(2);
    });

    it('is broken by a missed day', () => {
      expect(currentStreak(['2026-02-28', '2026-03-03'], '2026-03-03')).toBe(1);
      expect(currentStreak(['2026-03-01'], '2026-03-03')).toBe(0);
    });

    it('counts calendar days, not 24-hour windows', () => {
      expect(currentStreak(['2026-03-02', '2026-03-03'], '2026-03-03')).toBe(2);
    });
  });
});
