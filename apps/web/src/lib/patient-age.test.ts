import { describe, expect, it } from 'vitest';
import { ageInYears } from './patient-age';

describe('ageInYears', () => {
  it('counts the birthday itself as a completed year', () => {
    expect(ageInYears('1990-05-01', new Date(2026, 4, 1, 0, 30))).toBe(36);
  });

  it('does not count the year before the birthday', () => {
    expect(ageInYears('1990-05-01', new Date(2026, 3, 30, 23, 30))).toBe(35);
  });
});
