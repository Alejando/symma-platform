# Contract: packages/i18n

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03

## Package Overview

Shared internationalization package providing translations and utilities for web and API applications.

## Package Structure

```
packages/i18n/
├── src/
│   ├── locales/
│   │   └── es/
│   │       ├── common.json
│   │       ├── enums.json
│   │       ├── errors.json
│   │       └── validation.json
│   ├── types.ts
│   ├── enums.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## Exports

### Main Entry (index.ts)

```typescript
// Types
export type { 
  Locale,
  TranslationNamespace,
  EnumName,
  TranslatableEnum,
  Role,
  Gender,
  PatientStatus,
  ExerciseType,
  ExerciseCategory,
  RoutineStatus,
  MobileModule
} from './types';

// Enum utilities
export { 
  translateEnum,
  translateRole,
  translateGender,
  translatePatientStatus,
  translateExerciseType,
  translateExerciseCategory,
  translateRoutineStatus,
  translateMobileModule
} from './enums';

// Raw translation files (for library configuration)
export { default as commonEs } from './locales/es/common.json';
export { default as enumsEs } from './locales/es/enums.json';
export { default as errorsEs } from './locales/es/errors.json';
export { default as validationEs } from './locales/es/validation.json';

// Locale configuration
export const defaultLocale: Locale = 'es';
export const supportedLocales: Locale[] = ['es'];
```

## package.json

```json
{
  "name": "@symma/i18n",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./locales/*": "./src/locales/*"
  },
  "scripts": {
    "lint": "eslint src/",
    "check-types": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@symma/eslint-config": "workspace:*",
    "@symma/typescript-config": "workspace:*",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## tsconfig.json

```json
{
  "extends": "@symma/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

## Usage Examples

### Web (Next.js with next-intl)

```typescript
// apps/web/src/i18n/config.ts
import { commonEs, enumsEs, errorsEs, validationEs } from '@symma/i18n';

export const messages = {
  common: commonEs,
  enums: enumsEs,
  errors: errorsEs,
  validation: validationEs
};
```

### API (NestJS with nestjs-i18n)

```typescript
// apps/api/src/i18n/i18n.module.ts
import { I18nModule } from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: join(__dirname, '/locales/'),
        watch: true,
      },
    }),
  ],
})
export class AppI18nModule {}
```

### Enum Translation (Any TypeScript app)

```typescript
import { translatePatientStatus, translateExerciseType } from '@symma/i18n';

// In component or service
const statusLabel = translatePatientStatus('ACTIVE'); // "Activo"
const typeLabel = translateExerciseType('ISOTONIC');  // "Isotónico"
```

## Testing Contract

```typescript
// packages/i18n/src/enums.test.ts
import { describe, it, expect } from 'vitest';
import { 
  translateEnum,
  translatePatientStatus,
  translateRole 
} from './enums';

describe('translateEnum', () => {
  it('translates known enum values', () => {
    expect(translateEnum('PatientStatus', 'ACTIVE')).toBe('Activo');
    expect(translateEnum('Role', 'THERAPIST')).toBe('Terapeuta');
  });

  it('returns original value for unknown enum', () => {
    expect(translateEnum('UnknownEnum' as any, 'VALUE')).toBe('VALUE');
  });

  it('returns original value for unknown enum value', () => {
    expect(translateEnum('PatientStatus', 'UNKNOWN' as any)).toBe('UNKNOWN');
  });
});

describe('convenience functions', () => {
  it('translatePatientStatus works correctly', () => {
    expect(translatePatientStatus('ACTIVE')).toBe('Activo');
    expect(translatePatientStatus('INACTIVE')).toBe('Inactivo');
    expect(translatePatientStatus('ARCHIVED')).toBe('Archivado');
  });

  it('translateRole works correctly', () => {
    expect(translateRole('ADMIN')).toBe('Administrador');
    expect(translateRole('THERAPIST')).toBe('Terapeuta');
  });
});
```

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| All enum values must have translations | Unit test coverage |
| No empty translation values | Lint rule / test |
| JSON syntax validity | TypeScript compilation |
| Type safety for enum names | TypeScript strict mode |
