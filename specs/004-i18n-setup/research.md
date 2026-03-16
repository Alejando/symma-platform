# Research: Internationalization (i18n) Setup

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03  
**Status**: Complete

## Research Tasks

### 1. i18n Library Selection for Next.js (Web)

**Context**: Need a library compatible with Next.js 16+ App Router for server-side and client-side translations.

**Decision**: `next-intl`

**Rationale**:
- Native App Router support with RSC (React Server Components)
- Type-safe translation keys with TypeScript
- Built-in support for interpolation and pluralization
- Lightweight (~2KB gzipped)
- Active maintenance and large community
- No need for complex routing setup when using single locale

**Alternatives Considered**:
| Library | Rejected Because |
|---------|------------------|
| `react-i18next` | Requires additional setup for App Router, heavier bundle |
| `next-translate` | Less active maintenance, limited RSC support |
| `lingui` | More complex setup, overkill for single-locale initial phase |

**Implementation Notes**:
- Use `getTranslations()` for server components
- Use `useTranslations()` hook for client components
- Configure with `es` as default and only locale
- Messages loaded from `packages/i18n` shared package

---

### 2. i18n Library Selection for NestJS (API)

**Context**: Need i18n support for API error messages and validation responses.

**Decision**: `nestjs-i18n`

**Rationale**:
- Official NestJS ecosystem library
- Integrates with `class-validator` for DTO validation messages
- Supports JSON translation files
- Built-in language detection (Accept-Language header)
- Type-safe with TypeScript

**Alternatives Considered**:
| Library | Rejected Because |
|---------|------------------|
| `i18next` | Not NestJS-native, requires manual integration |
| Custom solution | Unnecessary complexity, reinventing the wheel |

**Implementation Notes**:
- Configure with `es` as fallback language
- Load translations from shared package or copy at build time
- Use `I18nService` for programmatic translations
- Integrate with exception filters for translated error responses

---

### 3. i18n Strategy for Android/Kotlin (Mobile)

**Context**: Need offline-capable translations for Android app with Jetpack Compose.

**Decision**: Android Resources (`strings.xml`) + Kotlin extension functions

**Rationale**:
- Native Android approach, zero additional dependencies
- Automatic locale handling by Android system
- Compile-time validation of string resources
- Works offline (bundled in APK)
- Jetpack Compose has built-in `stringResource()` support

**Alternatives Considered**:
| Approach | Rejected Because |
|----------|------------------|
| JSON files + custom loader | Adds complexity, no compile-time safety |
| Third-party library (Lokalise SDK) | Unnecessary dependency for offline-first app |
| Shared Kotlin Multiplatform | Overkill, mobile is Android-only |

**Implementation Notes**:
- Use `values/strings.xml` for default (Spanish)
- Future: Add `values-en/strings.xml` for English
- Create `EnumTranslations.kt` utility for enum display names
- Use `@StringRes` annotations for type safety

---

### 4. Shared Translation Strategy

**Context**: Need to share translations between web and API (TypeScript apps). Mobile uses native resources.

**Decision**: Create `packages/i18n` with JSON files and TypeScript utilities

**Rationale**:
- Centralizes translations for TypeScript apps
- JSON format compatible with both `next-intl` and `nestjs-i18n`
- Can generate TypeScript types from JSON keys
- Mobile syncs manually (different format requirement)

**Architecture**:
```
packages/i18n/
├── src/
│   ├── locales/
│   │   └── es/
│   │       ├── common.json     # UI labels, buttons, messages
│   │       ├── enums.json      # Enum translations
│   │       ├── errors.json     # Error messages
│   │       └── validation.json # Form validation messages
│   ├── types.ts                # Generated/manual type definitions
│   ├── enums.ts                # Enum translation utilities
│   └── index.ts                # Package exports
├── package.json
└── tsconfig.json
```

**Sync Strategy for Mobile**:
- Maintain `enums.json` as source of truth for enum translations
- Script to generate `EnumTranslations.kt` from `enums.json`
- Manual sync for other strings (different UI patterns)

---

### 5. Enum Translation Pattern

**Context**: Display translated enum values in UI while preserving original values in database.

**Decision**: Translation lookup utilities per platform

**Web (React)**:
```typescript
// packages/i18n/src/enums.ts
import enums from './locales/es/enums.json';

export function translateEnum<T extends string>(
  enumName: string,
  value: T
): string {
  return enums[enumName]?.[value] ?? value;
}

// Usage in component
<span>{translateEnum('PatientStatus', patient.status)}</span>
```

**API (NestJS)**:
```typescript
// Use I18nService for dynamic translation
const translated = this.i18n.t(`enums.PatientStatus.${status}`);
```

**Mobile (Kotlin)**:
```kotlin
// EnumTranslations.kt
fun PatientStatus.toDisplayName(): String = when (this) {
    PatientStatus.ACTIVE -> "Activo"
    PatientStatus.INACTIVE -> "Inactivo"
    PatientStatus.ARCHIVED -> "Archivado"
}
```

**Enums to Translate** (from Prisma schema):
| Enum | Values |
|------|--------|
| `Role` | ADMIN, THERAPIST |
| `Gender` | MALE, FEMALE, OTHER |
| `PatientStatus` | ACTIVE, INACTIVE, ARCHIVED |
| `ExerciseType` | ISOTONIC, ISOMETRIC, MANUAL, RELAXATION |
| `ExerciseCategory` | WARMUP, CORE, COOLDOWN |
| `RoutineStatus` | ACTIVE, ARCHIVED |
| `MobileModule` | EYES, EYES_INVERSE, BROWS, JAW, SMILE, KISS |

---

### 6. Pluralization and Interpolation

**Context**: Support for dynamic content like "5 pacientes" vs "1 paciente".

**Decision**: Use ICU message format (supported by both next-intl and nestjs-i18n)

**Example**:
```json
{
  "patients": "{count, plural, one {# paciente} other {# pacientes}}",
  "welcome": "Bienvenido, {name}"
}
```

**Spanish Pluralization Rules**:
- `one`: exactly 1
- `other`: everything else (0, 2, 3, ...)

---

### 7. Missing Translation Handling

**Context**: Need graceful fallback when translation key is missing.

**Decision**: 
- **Development**: Show key + console warning
- **Production**: Show key (no crash)

**Implementation**:
- `next-intl`: Configure `onError` handler
- `nestjs-i18n`: Default behavior returns key
- Mobile: Compile-time safety prevents missing strings

---

### 8. Future Multi-language Support

**Context**: Architecture must support adding languages without code changes.

**Decision**: Locale-based file structure with configuration-driven locale list

**Adding a new language**:
1. Create `locales/en/` directory with translated JSON files
2. Add `en` to supported locales configuration
3. (Future) Add language selector UI component
4. Mobile: Add `values-en/strings.xml`

**No code changes required** - just configuration and translation files.

---

## Summary of Decisions

| Area | Decision | Package/Tool |
|------|----------|--------------|
| Web i18n | next-intl | `next-intl@3.x` |
| API i18n | nestjs-i18n | `nestjs-i18n@10.x` |
| Mobile i18n | Android Resources | Native |
| Shared translations | packages/i18n | Custom package |
| Translation format | JSON (ICU) | — |
| Enum translation | Utility functions | Per-platform |
| Default locale | Spanish (es) | — |
| Fallback behavior | Show key | — |

## Open Questions

None - all technical decisions resolved.
