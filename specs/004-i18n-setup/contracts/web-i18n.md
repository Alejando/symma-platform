# Contract: Web i18n Integration

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03

## Overview

Integration of `next-intl` with Next.js App Router for the web application.

## Configuration Files

### apps/web/src/i18n/config.ts

```typescript
import { commonEs, enumsEs, errorsEs, validationEs } from '@symma/i18n';

export type Messages = typeof messages;

export const messages = {
  common: commonEs,
  enums: enumsEs,
  errors: errorsEs,
  validation: validationEs
} as const;

export const locales = ['es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';
```

### apps/web/src/i18n/request.ts

```typescript
import { getRequestConfig } from 'next-intl/server';
import { messages, defaultLocale } from './config';

export default getRequestConfig(async () => {
  // For now, always return Spanish
  // Future: detect from headers or user preference
  return {
    locale: defaultLocale,
    messages
  };
});
```

### apps/web/next.config.mjs (additions)

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // existing config...
};

export default withNextIntl(nextConfig);
```

## Provider Setup

### apps/web/src/app/layout.tsx (modifications)

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Usage Patterns

### Server Components

```typescript
import { getTranslations } from 'next-intl/server';

export default async function PatientsPage() {
  const t = await getTranslations('common');
  
  return (
    <div>
      <h1>{t('nav.patients')}</h1>
      <button>{t('buttons.create')}</button>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function PatientForm() {
  const t = useTranslations('common');
  const tValidation = useTranslations('validation');
  
  return (
    <form>
      <button type="submit">{t('buttons.save')}</button>
      <span className="error">{tValidation('required')}</span>
    </form>
  );
}
```

### Enum Display Component

```typescript
// apps/web/src/components/ui/enum-label.tsx
'use client';

import { useTranslations } from 'next-intl';
import type { EnumName } from '@symma/i18n';

interface EnumLabelProps {
  enumName: EnumName;
  value: string;
  className?: string;
}

export function EnumLabel({ enumName, value, className }: EnumLabelProps) {
  const t = useTranslations('enums');
  
  return (
    <span className={className}>
      {t(`${enumName}.${value}`)}
    </span>
  );
}

// Usage
<EnumLabel enumName="PatientStatus" value={patient.status} />
```

### Interpolation

```typescript
const t = useTranslations('common');

// With variables
t('pagination.showing', { from: 1, to: 10, total: 100 });
// → "Mostrando 1 a 10 de 100"

// With pluralization
t('time.daysAgo', { count: 5 });
// → "Hace 5 días"
```

## Dependencies

```json
{
  "dependencies": {
    "next-intl": "^3.0.0"
  }
}
```

## Testing Contract

```typescript
// apps/web/src/components/ui/enum-label.test.tsx
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { EnumLabel } from './enum-label';
import { messages } from '@/i18n/config';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="es" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

describe('EnumLabel', () => {
  it('renders translated enum value', () => {
    render(
      <EnumLabel enumName="PatientStatus" value="ACTIVE" />,
      { wrapper }
    );
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('renders all PatientStatus values correctly', () => {
    const statuses = [
      { value: 'ACTIVE', expected: 'Activo' },
      { value: 'INACTIVE', expected: 'Inactivo' },
      { value: 'ARCHIVED', expected: 'Archivado' },
    ];

    statuses.forEach(({ value, expected }) => {
      const { unmount } = render(
        <EnumLabel enumName="PatientStatus" value={value} />,
        { wrapper }
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });
});
```

## Error Handling

```typescript
// next-intl configuration for missing translations
// apps/web/src/i18n/request.ts

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[i18n]', error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      return `${namespace}.${key}`;
    }
  };
});
```
