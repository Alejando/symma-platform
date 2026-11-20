import { renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { useDateFormatter } from './use-date-formatter';

function renderFormatterIn(timeZone: string) {
  return renderHook(() => useDateFormatter(), {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={{}} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    ),
  }).result.current;
}

describe('useDateFormatter calendarDate', () => {
  it('keeps a routine start date on the chosen day for therapists behind UTC', () => {
    const formatDate = renderFormatterIn('America/Mexico_City');

    expect(formatDate.calendarDate('2026-11-01T00:00:00.000Z')).toBe('Nov 1, 2026');
  });

  it('keeps the chosen day for therapists ahead of UTC', () => {
    const formatDate = renderFormatterIn('Asia/Tokyo');

    expect(formatDate.calendarDate('2026-11-01T00:00:00.000Z')).toBe('Nov 1, 2026');
  });
});
