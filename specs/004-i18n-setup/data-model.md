# Data Model: Internationalization (i18n) Setup

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03  
**Status**: Complete

## Overview

This feature does **not** introduce new database entities. Translations are stored as static JSON files in the codebase, not in the database. This document defines the structure of translation files and TypeScript types.

## Translation File Structure

### Namespace Organization

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `common` | UI labels, buttons, navigation | `buttons.save`, `nav.patients` |
| `enums` | Enum value translations | `PatientStatus.ACTIVE` |
| `errors` | Error messages | `errors.notFound`, `errors.unauthorized` |
| `validation` | Form validation messages | `validation.required`, `validation.email` |

### JSON Schema

#### common.json
```json
{
  "app": {
    "name": "Symma",
    "tagline": "Rehabilitación facial inteligente"
  },
  "nav": {
    "dashboard": "Panel",
    "patients": "Pacientes",
    "routines": "Rutinas",
    "sessions": "Sesiones",
    "settings": "Configuración",
    "logout": "Cerrar sesión"
  },
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "back": "Volver",
    "next": "Siguiente",
    "previous": "Anterior",
    "confirm": "Confirmar",
    "close": "Cerrar"
  },
  "labels": {
    "search": "Buscar",
    "filter": "Filtrar",
    "loading": "Cargando...",
    "noResults": "Sin resultados",
    "actions": "Acciones"
  },
  "messages": {
    "saveSuccess": "Guardado exitosamente",
    "deleteSuccess": "Eliminado exitosamente",
    "deleteConfirm": "¿Estás seguro de que deseas eliminar este elemento?",
    "unsavedChanges": "Tienes cambios sin guardar. ¿Deseas continuar?"
  },
  "pagination": {
    "showing": "Mostrando {from} a {to} de {total}",
    "itemsPerPage": "Elementos por página",
    "page": "Página {current} de {total}"
  },
  "time": {
    "today": "Hoy",
    "yesterday": "Ayer",
    "daysAgo": "Hace {count, plural, one {# día} other {# días}}",
    "minutes": "{count, plural, one {# minuto} other {# minutos}}",
    "seconds": "{count, plural, one {# segundo} other {# segundos}}"
  }
}
```

#### enums.json
```json
{
  "Role": {
    "ADMIN": "Administrador",
    "THERAPIST": "Terapeuta"
  },
  "Gender": {
    "MALE": "Masculino",
    "FEMALE": "Femenino",
    "OTHER": "Otro"
  },
  "PatientStatus": {
    "ACTIVE": "Activo",
    "INACTIVE": "Inactivo",
    "ARCHIVED": "Archivado"
  },
  "ExerciseType": {
    "ISOTONIC": "Isotónico",
    "ISOMETRIC": "Isométrico",
    "MANUAL": "Manual",
    "RELAXATION": "Relajación"
  },
  "ExerciseCategory": {
    "WARMUP": "Calentamiento",
    "CORE": "Principal",
    "COOLDOWN": "Enfriamiento"
  },
  "RoutineStatus": {
    "ACTIVE": "Activa",
    "ARCHIVED": "Archivada"
  },
  "MobileModule": {
    "EYES": "Ojos",
    "EYES_INVERSE": "Ojos (inverso)",
    "BROWS": "Cejas",
    "JAW": "Mandíbula",
    "SMILE": "Sonrisa",
    "KISS": "Beso"
  }
}
```

#### errors.json
```json
{
  "generic": "Ha ocurrido un error. Por favor, intenta de nuevo.",
  "notFound": "Recurso no encontrado",
  "unauthorized": "No autorizado. Por favor, inicia sesión.",
  "forbidden": "No tienes permiso para realizar esta acción",
  "validation": "Error de validación. Revisa los campos marcados.",
  "network": "Error de conexión. Verifica tu conexión a internet.",
  "server": "Error del servidor. Por favor, intenta más tarde.",
  "session": {
    "expired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
  },
  "patient": {
    "notFound": "Paciente no encontrado",
    "alreadyExists": "Ya existe un paciente con este correo electrónico"
  },
  "routine": {
    "notFound": "Rutina no encontrada",
    "noExercises": "La rutina debe tener al menos un ejercicio"
  }
}
```

#### validation.json
```json
{
  "required": "Este campo es requerido",
  "email": "Ingresa un correo electrónico válido",
  "minLength": "Debe tener al menos {min} caracteres",
  "maxLength": "Debe tener máximo {max} caracteres",
  "min": "El valor mínimo es {min}",
  "max": "El valor máximo es {max}",
  "pattern": "Formato inválido",
  "phone": "Ingresa un número de teléfono válido",
  "date": "Ingresa una fecha válida",
  "dateRange": "La fecha de fin debe ser posterior a la fecha de inicio",
  "password": {
    "weak": "La contraseña es muy débil",
    "mismatch": "Las contraseñas no coinciden"
  }
}
```

## TypeScript Types

### Translation Key Types

```typescript
// packages/i18n/src/types.ts

export type Locale = 'es'; // Future: 'es' | 'en'

export type TranslationNamespace = 
  | 'common' 
  | 'enums' 
  | 'errors' 
  | 'validation';

// Enum types (mirrored from Prisma)
export type Role = 'ADMIN' | 'THERAPIST';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ExerciseType = 'ISOTONIC' | 'ISOMETRIC' | 'MANUAL' | 'RELAXATION';
export type ExerciseCategory = 'WARMUP' | 'CORE' | 'COOLDOWN';
export type RoutineStatus = 'ACTIVE' | 'ARCHIVED';
export type MobileModule = 'EYES' | 'EYES_INVERSE' | 'BROWS' | 'JAW' | 'SMILE' | 'KISS';

export type TranslatableEnum = 
  | Role 
  | Gender 
  | PatientStatus 
  | ExerciseType 
  | ExerciseCategory 
  | RoutineStatus
  | MobileModule;

export type EnumName = 
  | 'Role' 
  | 'Gender' 
  | 'PatientStatus' 
  | 'ExerciseType' 
  | 'ExerciseCategory' 
  | 'RoutineStatus'
  | 'MobileModule';
```

### Enum Translation Utility

```typescript
// packages/i18n/src/enums.ts

import type { EnumName, TranslatableEnum } from './types';
import enums from './locales/es/enums.json';

type EnumTranslations = typeof enums;

export function translateEnum<T extends EnumName>(
  enumName: T,
  value: EnumTranslations[T] extends Record<string, string> 
    ? keyof EnumTranslations[T] 
    : never
): string {
  const translations = enums[enumName] as Record<string, string> | undefined;
  if (!translations) {
    console.warn(`[i18n] Unknown enum: ${enumName}`);
    return String(value);
  }
  
  const translated = translations[value as string];
  if (!translated) {
    console.warn(`[i18n] Unknown enum value: ${enumName}.${String(value)}`);
    return String(value);
  }
  
  return translated;
}

// Convenience functions for each enum
export const translateRole = (value: string) => translateEnum('Role', value as any);
export const translateGender = (value: string) => translateEnum('Gender', value as any);
export const translatePatientStatus = (value: string) => translateEnum('PatientStatus', value as any);
export const translateExerciseType = (value: string) => translateEnum('ExerciseType', value as any);
export const translateExerciseCategory = (value: string) => translateEnum('ExerciseCategory', value as any);
export const translateRoutineStatus = (value: string) => translateEnum('RoutineStatus', value as any);
export const translateMobileModule = (value: string) => translateEnum('MobileModule', value as any);
```

## Mobile Data Model (Kotlin)

### EnumTranslations.kt

```kotlin
// apps/mobile/app/src/main/java/com/symma/app/i18n/EnumTranslations.kt

package com.symma.app.i18n

import com.symma.app.domain.model.*

fun Role.toDisplayName(): String = when (this) {
    Role.ADMIN -> "Administrador"
    Role.THERAPIST -> "Terapeuta"
}

fun Gender.toDisplayName(): String = when (this) {
    Gender.MALE -> "Masculino"
    Gender.FEMALE -> "Femenino"
    Gender.OTHER -> "Otro"
}

fun PatientStatus.toDisplayName(): String = when (this) {
    PatientStatus.ACTIVE -> "Activo"
    PatientStatus.INACTIVE -> "Inactivo"
    PatientStatus.ARCHIVED -> "Archivado"
}

fun ExerciseType.toDisplayName(): String = when (this) {
    ExerciseType.ISOTONIC -> "Isotónico"
    ExerciseType.ISOMETRIC -> "Isométrico"
    ExerciseType.MANUAL -> "Manual"
    ExerciseType.RELAXATION -> "Relajación"
}

fun ExerciseCategory.toDisplayName(): String = when (this) {
    ExerciseCategory.WARMUP -> "Calentamiento"
    ExerciseCategory.CORE -> "Principal"
    ExerciseCategory.COOLDOWN -> "Enfriamiento"
}

fun RoutineStatus.toDisplayName(): String = when (this) {
    RoutineStatus.ACTIVE -> "Activa"
    RoutineStatus.ARCHIVED -> "Archivada"
}

fun MobileModule.toDisplayName(): String = when (this) {
    MobileModule.EYES -> "Ojos"
    MobileModule.EYES_INVERSE -> "Ojos (inverso)"
    MobileModule.BROWS -> "Cejas"
    MobileModule.JAW -> "Mandíbula"
    MobileModule.SMILE -> "Sonrisa"
    MobileModule.KISS -> "Beso"
}
```

## Validation Rules

| Rule | Description |
|------|-------------|
| Key uniqueness | Each translation key must be unique within its namespace |
| No empty values | Translation values must not be empty strings |
| Placeholder consistency | Placeholders like `{name}` must match between locales |
| Enum completeness | All enum values must have translations |
| ICU syntax | Pluralization must follow ICU message format |

## State Transitions

Not applicable - translations are static files with no state transitions.

## Relationships

```
packages/i18n
    ├── consumed by → apps/web (via next-intl)
    ├── consumed by → apps/api (via nestjs-i18n)
    └── synced to → apps/mobile (manual sync for enums)

Translation Files
    └── enums.json → source of truth for enum translations
        ├── generates → TypeScript utilities (packages/i18n/src/enums.ts)
        └── syncs to → Kotlin utilities (apps/mobile/.../EnumTranslations.kt)
```
