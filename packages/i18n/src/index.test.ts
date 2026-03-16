import { describe, it, expect } from 'vitest';
import * as i18n from './index';

describe('i18n package exports', () => {
  it('should export locales array', () => {
    expect(i18n.locales).toBeDefined();
    expect(Array.isArray(i18n.locales)).toBe(true);
    expect(i18n.locales).toContain('es');
  });

  it('should export defaultLocale', () => {
    expect(i18n.defaultLocale).toBeDefined();
    expect(i18n.defaultLocale).toBe('es');
  });
});
