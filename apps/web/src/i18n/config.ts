import { locales, defaultLocale } from '@symma/i18n';

export { locales, defaultLocale };

export async function getMessages(locale: string) {
  try {
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
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}`, error);
    return {};
  }
}
