import { describe, it, expect } from 'vitest';
import * as config from './config';

describe('i18n config', () => {
  it('should export locales and defaultLocale from @symma/i18n', () => {
    expect(config.locales).toEqual(['es', 'en']);
    expect(config.defaultLocale).toBe('es');
  });

  it('loads the messages of the requested locale', async () => {
    const spanish = await config.getMessages('es');
    const english = await config.getMessages('en');

    expect(spanish.common.nav.patients).toBe('Pacientes');
    expect(english.common.nav.patients).toBe('Patients');
  });

  it('falls back to the default locale for unsupported or missing values', () => {
    expect(config.resolveLocale('en')).toBe('en');
    expect(config.resolveLocale('fr')).toBe('es');
    expect(config.resolveLocale(undefined)).toBe('es');
  });
});
