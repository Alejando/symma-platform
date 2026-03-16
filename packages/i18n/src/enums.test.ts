import { describe, it, expect } from 'vitest';
import { translateEnum } from './enums';

describe('translateEnum', () => {
  it('should translate known enum values correctly', () => {
    expect(translateEnum('Role', 'ADMIN')).toBe('Administrador');
    expect(translateEnum('PatientStatus', 'ACTIVE')).toBe('Activo');
    expect(translateEnum('ExerciseType', 'ISOTONIC')).toBe('Isotónico');
  });

  it('should return the original value if translation is missing', () => {
    // We cast to any to test the fallback behavior for missing keys
    expect(translateEnum('Role', 'UNKNOWN' as any)).toBe('UNKNOWN');
    expect(translateEnum('UnknownEnum' as any, 'SOME_VALUE')).toBe('SOME_VALUE');
  });
});
