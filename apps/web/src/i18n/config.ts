import { locales, defaultLocale, type Locale } from '@symma/i18n';

export { locales, defaultLocale };
export type { Locale };

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function resolveLocale(candidate: string | undefined): Locale {
  return locales.find((locale) => locale === candidate) ?? defaultLocale;
}

export async function getMessages(locale: Locale) {
  if (locale === 'en') {
    return {
      common: (await import('@symma/i18n/src/locales/en/common.json')).default,
      errors: (await import('@symma/i18n/src/locales/en/errors.json')).default,
      validation: (await import('@symma/i18n/src/locales/en/validation.json')).default,
      enums: (await import('@symma/i18n/src/locales/en/enums.json')).default,
    };
  }

  return {
    common: (await import('@symma/i18n/src/locales/es/common.json')).default,
    errors: (await import('@symma/i18n/src/locales/es/errors.json')).default,
    validation: (await import('@symma/i18n/src/locales/es/validation.json')).default,
    enums: (await import('@symma/i18n/src/locales/es/enums.json')).default,
  };
}
