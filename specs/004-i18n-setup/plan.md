# Implementation Plan: Internationalization (i18n) Setup

**Branch**: `004-i18n-setup` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-i18n-setup/spec.md`

## Summary

Implement internationalization infrastructure across all Symma applications (web, API, mobile) with Spanish as the default and only active language. The solution centralizes translations in a shared package, provides enum translation utilities, and establishes architecture for future multi-language support without requiring a language selector UI.

## Technical Context

**Language/Version**: TypeScript 5.x (web/api), Kotlin (mobile)  
**Primary Dependencies**: next-intl (web), nestjs-i18n (api), Android Resources + Kotlin (mobile)  
**Storage**: JSON files for translations (no database storage)  
**Testing**: Vitest (web), Jest (api), JUnit + MockK (mobile)  
**Target Platform**: Web (Next.js 16+), API (NestJS 11+), Android (SDK 26+)  
**Project Type**: Monorepo with web + api + mobile  
**Performance Goals**: <100ms additional load time for translations  
**Constraints**: Offline-capable (mobile must bundle translations), shared translations across apps  
**Scale/Scope**: ~50 UI screens, ~10 enums to translate, Spanish only initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Patient Privacy First | ✅ Pass | No sensitive data in translations |
| II. Offline-First Mobile | ✅ Pass | Translations bundled in APK |
| III. On-Device Computer Vision | N/A | Not applicable to i18n |
| IV. Type Safety Across Boundaries | ✅ Pass | Shared types for translation keys |
| V. Test-Driven Quality | ✅ Pass | Unit tests for translation utilities |
| VI. Clinical Accuracy | N/A | Not applicable to i18n |
| VII. Monorepo Cohesion | ✅ Pass | Shared package for translations |

**Gate Result**: ✅ PASS - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/004-i18n-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── i18n/                        # NEW: Shared i18n package
│   ├── src/
│   │   ├── locales/
│   │   │   └── es/
│   │   │       ├── common.json      # Common UI strings
│   │   │       └── enums.json       # Enum translations
│   │   ├── types.ts                 # Translation key types
│   │   ├── enums.ts                 # Enum translation utilities
│   │   └── index.ts                 # Package exports
│   ├── package.json
│   └── tsconfig.json
├── shared-types/
│   └── src/
│       └── enums.ts                 # Enum type definitions (existing)

apps/
├── web/
│   └── src/
│       ├── i18n/
│       │   ├── config.ts            # next-intl configuration
│       │   └── request.ts           # Server-side i18n setup
│       └── components/
│           └── enum-label.tsx       # Enum display component
├── api/
│   └── src/
│       └── i18n/
│           ├── i18n.module.ts       # NestJS i18n module
│           └── i18n.service.ts      # Translation service
└── mobile/
    └── app/src/main/
        ├── res/
        │   └── values-es/
        │       └── strings.xml      # Spanish strings
        └── java/.../
            └── i18n/
                └── EnumTranslations.kt  # Enum translation utility
```

**Structure Decision**: Monorepo structure with new `packages/i18n` for shared translations. Each app (web, api, mobile) has its own i18n integration layer that consumes the shared package.

## Complexity Tracking

> No violations detected - table not required.

## Phase Completion Status

| Phase | Status | Output |
|-------|--------|--------|
| Phase 0: Research | ✅ Complete | [research.md](./research.md) |
| Phase 1: Design | ✅ Complete | [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) |
| Phase 2: Tasks | ✅ Complete | [tasks.md](./tasks.md) |

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Patient Privacy First | ✅ Pass | No sensitive data in translations |
| II. Offline-First Mobile | ✅ Pass | Translations bundled in APK via strings.xml |
| III. On-Device Computer Vision | N/A | Not applicable |
| IV. Type Safety Across Boundaries | ✅ Pass | TypeScript types for translation keys, Kotlin extension functions |
| V. Test-Driven Quality | ✅ Pass | Test contracts defined for all components |
| VI. Clinical Accuracy | N/A | Not applicable |
| VII. Monorepo Cohesion | ✅ Pass | `@symma/i18n` package, pnpm workspace |

**Post-Design Gate Result**: ✅ PASS
