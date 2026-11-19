import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import esCommon from '@symma/i18n/src/locales/es/common.json';
import esEnums from '@symma/i18n/src/locales/es/enums.json';
import esErrors from '@symma/i18n/src/locales/es/errors.json';
import esValidation from '@symma/i18n/src/locales/es/validation.json';

export const esMessages = {
  common: esCommon,
  enums: esEnums,
  errors: esErrors,
  validation: esValidation,
};

export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="es" messages={esMessages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
