import { useCallback } from 'react';
import { useFormatter } from 'next-intl';

/** Formats values that the API already sends on the 0–100 scale. */
export function usePercentFormatter() {
  const format = useFormatter();

  return useCallback(
    (value: number, fractionDigits = 0) =>
      `${format.number(value, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}%`,
    [format],
  );
}
