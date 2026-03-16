import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnumLabel } from './enum-label';
import { NextIntlClientProvider } from 'next-intl';

// Mock useTranslations
const mockTranslations = {
  Role: {
    ADMIN: 'Administrador',
    THERAPIST: 'Terapeuta'
  }
};

describe('EnumLabel', () => {
  it('should render translated enum value', () => {
    render(
      <NextIntlClientProvider locale="es" messages={{ enums: mockTranslations }}>
        <EnumLabel enumName="Role" value="ADMIN" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('should fallback to raw value if translation is missing', () => {
    render(
      <NextIntlClientProvider locale="es" messages={{ enums: mockTranslations }}>
        <EnumLabel enumName="Role" value="UNKNOWN" />
      </NextIntlClientProvider>
    );
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});
