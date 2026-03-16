# @symma/i18n

Shared internationalization package for the Symma Platform.

## Usage in Web App (Next.js)

The web app uses `next-intl`. Translations are loaded automatically.

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  return <div>{t('labels.name')}</div>;
}
```

For enums, use the provided `EnumLabel` component:

```tsx
import { EnumLabel } from '@/components/ui/enum-label';

<EnumLabel enumName="PatientStatus" value="ACTIVE" />
```

## Usage in API (NestJS)

The API uses `nestjs-i18n`. Use the `TranslationService` to translate messages:

```typescript
import { TranslationService } from '../i18n/i18n.service';

@Injectable()
export class MyService {
  constructor(private i18n: TranslationService) {}

  doSomething() {
    const errorMsg = this.i18n.translateError('auth.unauthorized');
    const roleName = this.i18n.translateEnum('Role', 'ADMIN');
  }
}
```

## Adding a New Language

Architecture supports adding new languages without code changes:

1. Create a new directory in `src/locales/` (e.g., `src/locales/en/`)
2. Copy all JSON files from `src/locales/es/` and translate their values
3. Update `Locale` and `locales` array in `src/types.ts`
4. Rebuild apps to pick up the changes

## Mobile App Sync Process

The mobile app (Android) uses native Android Resources (`strings.xml`) for translations instead of JSON files, as this provides compile-time safety and works perfectly offline.

To sync translations to mobile:

1. Manually update `apps/mobile/app/src/main/res/values/strings.xml` with new keys
2. Update `apps/mobile/app/src/main/java/com/symma/app/i18n/EnumTranslations.kt` for any new enum values
3. (Future) We will implement the `scripts/sync-mobile.ts` script to automate this generation from the JSON files.
