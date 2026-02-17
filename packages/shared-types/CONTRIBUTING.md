# Contributing to @symma/shared-types

This package is the **single source of truth** for all API contracts across the Symma Platform. Changes here affect the API, Web Dashboard, and Mobile App.

## Contract Evolution Rules

### 1. Adding New Fields

**Non-breaking change** — safe to add at any time.

- New fields **MUST be optional** (`fieldName?: Type`)
- Add JSDoc documentation explaining the field
- Increment PATCH version

```typescript
export interface PatientResponse {
  id: string;
  firstName: string;
  // ... existing fields ...
  
  /** New field added in v1.0.1 — patient's preferred language */
  preferredLanguage?: string;
}
```

### 2. Removing Fields

**Breaking change** — requires deprecation period.

1. Mark the field as optional (if not already)
2. Add `@deprecated` JSDoc tag with removal version
3. Keep for at least 2 minor versions
4. Increment MINOR version when deprecating
5. Increment MAJOR version when removing

```typescript
export interface PatientResponse {
  id: string;
  
  /**
   * @deprecated Since v1.2.0 — use `phoneNumber` instead. Will be removed in v2.0.0
   */
  phone?: string;
  
  phoneNumber?: string;
}
```

### 3. Renaming Fields

**Breaking change** — use add-new + deprecate-old pattern.

1. Add the new field name
2. Deprecate the old field name
3. API returns both during transition
4. Remove old field after deprecation period

### 4. Enum Changes

| Change | Breaking? | Action |
|--------|-----------|--------|
| Add value | No | Safe to add anytime |
| Remove value | Yes | Deprecate first, then remove in MAJOR |
| Rename value | Yes | Add new + deprecate old |

### 5. Adding New Contracts

**Non-breaking change** — increment MINOR version.

- Create new file in `src/` directory
- Export from `src/index.ts`
- Add tests in corresponding `.spec.ts` file

## Versioning (SemVer)

| Version | When to increment |
|---------|-------------------|
| PATCH (0.0.X) | Optional field additions, documentation fixes |
| MINOR (0.X.0) | New contracts, field deprecations |
| MAJOR (X.0.0) | Required field changes, field removals, breaking type changes |

## Pre-Commit Checklist

- [ ] All new fields are optional
- [ ] Deprecated fields have `@deprecated` JSDoc
- [ ] Tests pass: `pnpm test`
- [ ] Types compile: `pnpm check-types`
- [ ] Exports updated in `src/index.ts`

## Consumers

Changes to this package affect:

- **API** (`apps/api`) — DTOs implement these interfaces
- **Web** (`apps/web`) — TypeScript imports for type safety
- **Mobile** (`apps/mobile`) — Kotlin models generated from OpenAPI spec

Always coordinate breaking changes with all consumer teams.
