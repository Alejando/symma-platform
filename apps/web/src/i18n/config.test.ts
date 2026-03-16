import { describe, it, expect, vi } from 'vitest';
import * as config from './config';

describe('i18n config', () => {
  it('should export locales and defaultLocale from @symma/i18n', () => {
    expect(config.locales).toBeDefined();
    expect(config.defaultLocale).toBeDefined();
    expect(config.locales).toContain('es');
    expect(config.defaultLocale).toBe('es');
  });

  it('should be able to get messages for es locale', async () => {
    const messages = await config.getMessages('es');
    expect(messages).toBeDefined();
    // Verify some common keys exist
    expect(messages.common).toBeDefined();
    expect(messages.common.nav).toBeDefined();
  });
});
