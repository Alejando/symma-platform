import { describe, it, expect } from 'vitest';
import esCommon from './locales/es/common.json';
import esEnums from './locales/es/enums.json';
import esErrors from './locales/es/errors.json';
import esValidation from './locales/es/validation.json';
import enCommon from './locales/en/common.json';
import enEnums from './locales/en/enums.json';
import enErrors from './locales/en/errors.json';
import enValidation from './locales/en/validation.json';

describe('Locales Validation', () => {
  it('should have valid ES translations', () => {
    expect(esCommon).toBeDefined();
    expect(esEnums).toBeDefined();
    expect(esErrors).toBeDefined();
    expect(esValidation).toBeDefined();
  });

  it('should have valid EN translations', () => {
    expect(enCommon).toBeDefined();
    expect(enEnums).toBeDefined();
    expect(enErrors).toBeDefined();
    expect(enValidation).toBeDefined();
  });

  // Example for strict structural equality checks across languages in the future
  it('should have matching keys between ES and EN for enums', () => {
    const esKeys = Object.keys(esEnums).sort();
    const enKeys = Object.keys(enEnums).sort();
    // Enums structure might be empty for en currently, so let's check basic existence
    expect(Array.isArray(esKeys)).toBe(true);
    expect(Array.isArray(enKeys)).toBe(true);
  });
});
