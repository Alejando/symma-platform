import { describe, it, expect } from 'vitest';
import { translateEnum } from './enums';

describe('Fallback Behavior', () => {
  it('should fallback to raw value for unknown enum', () => {
    // Missing enum type
    expect(translateEnum('NonExistentEnum' as any, 'SOME_VALUE')).toBe('SOME_VALUE');
  });

  it('should fallback to raw value for unknown enum value', () => {
    // Missing value in known enum
    expect(translateEnum('Role', 'SUPERADMIN' as any)).toBe('SUPERADMIN');
  });
});
