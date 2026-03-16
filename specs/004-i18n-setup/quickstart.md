# Quickstart: Internationalization (i18n) Setup

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03

## Prerequisites

- Node.js 18+
- pnpm 8+
- Android Studio (for mobile)

## Quick Setup

### 1. Install Dependencies

```bash
# From repo root
pnpm install

# Install new i18n dependencies
pnpm --filter @symma/web add next-intl
pnpm --filter @symma/api add nestjs-i18n
```

### 2. Create i18n Package

```bash
# Create package structure
mkdir -p packages/i18n/src/locales/es

# Initialize package
cat > packages/i18n/package.json << 'EOF'
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
EOF
```

### 3. Add Translation Files

See `data-model.md` for complete JSON content. Create:
- `packages/i18n/src/locales/es/common.json`
- `packages/i18n/src/locales/es/enums.json`
- `packages/i18n/src/locales/es/errors.json`
- `packages/i18n/src/locales/es/validation.json`

### 4. Configure Web App

```bash
# Update next.config.mjs
# Add NextIntlClientProvider to layout.tsx
# Create src/i18n/config.ts and src/i18n/request.ts
```

### 5. Configure API

```bash
# Create src/i18n/i18n.module.ts
# Add AppI18nModule to app.module.ts
# Copy locales to src/i18n/locales/
```

### 6. Configure Mobile

```bash
# Update res/values/strings.xml with Spanish strings
# Create EnumTranslations.kt
```

## Verification

### Web
```bash
pnpm --filter @symma/web dev
# Navigate to any page - all text should be in Spanish
```

### API
```bash
pnpm --filter @symma/api dev
# Test error responses - should return Spanish messages
curl -X GET http://localhost:4001/api/patients/invalid-id
# Should return: {"message": "Paciente no encontrado", ...}
```

### Mobile
```bash
# Build and run in Android Studio
# All UI text should be in Spanish
```

## Testing

```bash
# Run all i18n tests
pnpm --filter @symma/i18n test
pnpm --filter @symma/web test -- --grep i18n
pnpm --filter @symma/api test -- --grep i18n

# Mobile tests
./gradlew :app:testDebugUnitTest --tests "*EnumTranslations*"
```

## Common Tasks

### Add a new translation key

1. Add to `packages/i18n/src/locales/es/<namespace>.json`
2. Use in web: `t('namespace.key')`
3. Use in API: `this.translationService.translate('namespace.key')`
4. For mobile: Add to `strings.xml` and use `stringResource(R.string.key)`

### Add a new enum

1. Add translations to `packages/i18n/src/locales/es/enums.json`
2. Add convenience function to `packages/i18n/src/enums.ts`
3. Add extension function to `apps/mobile/.../EnumTranslations.kt`
4. Add to `strings.xml` with `enum_<name>_<value>` pattern

### Test missing translations

```typescript
// In development, missing keys show as "namespace.key"
// Check console for warnings
```

## File Reference

| File | Purpose |
|------|---------|
| `packages/i18n/src/index.ts` | Package exports |
| `packages/i18n/src/types.ts` | TypeScript types |
| `packages/i18n/src/enums.ts` | Enum translation utilities |
| `packages/i18n/src/locales/es/*.json` | Spanish translations |
| `apps/web/src/i18n/config.ts` | Web i18n configuration |
| `apps/web/src/i18n/request.ts` | Server-side i18n setup |
| `apps/api/src/i18n/i18n.module.ts` | API i18n module |
| `apps/api/src/i18n/i18n.service.ts` | Translation service |
| `apps/mobile/.../EnumTranslations.kt` | Mobile enum translations |
| `apps/mobile/res/values/strings.xml` | Mobile string resources |

## Troubleshooting

### "Translation key not found"
- Check the key exists in the correct namespace JSON file
- Verify the namespace is imported in the i18n config
- Check for typos in the key path

### Enum not translating
- Verify the enum value matches exactly (case-sensitive)
- Check `enums.json` has the enum and value
- For mobile, ensure the `when` branch exists

### Mobile strings not updating
- Clean and rebuild: `./gradlew clean assembleDebug`
- Invalidate caches in Android Studio

## Next Steps

After setup, run `/speckit.tasks` to generate implementation tasks.
