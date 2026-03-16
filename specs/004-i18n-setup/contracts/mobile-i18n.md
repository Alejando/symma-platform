# Contract: Mobile i18n Integration

**Feature**: 004-i18n-setup  
**Date**: 2026-03-03

## Overview

Android native internationalization using string resources and Kotlin extension functions for enum translations.

## Resource Files

### apps/mobile/app/src/main/res/values/strings.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- App -->
    <string name="app_name">Symma</string>
    <string name="app_tagline">Rehabilitación facial inteligente</string>

    <!-- Navigation -->
    <string name="nav_home">Inicio</string>
    <string name="nav_exercises">Ejercicios</string>
    <string name="nav_progress">Progreso</string>
    <string name="nav_settings">Configuración</string>

    <!-- Buttons -->
    <string name="btn_start">Iniciar</string>
    <string name="btn_stop">Detener</string>
    <string name="btn_pause">Pausar</string>
    <string name="btn_resume">Continuar</string>
    <string name="btn_skip">Omitir</string>
    <string name="btn_retry">Reintentar</string>
    <string name="btn_done">Listo</string>
    <string name="btn_cancel">Cancelar</string>
    <string name="btn_confirm">Confirmar</string>
    <string name="btn_save">Guardar</string>

    <!-- Labels -->
    <string name="label_loading">Cargando…</string>
    <string name="label_no_results">Sin resultados</string>
    <string name="label_error">Error</string>
    <string name="label_success">Éxito</string>

    <!-- Exercise Session -->
    <string name="session_reps_remaining">Repeticiones restantes: %1$d</string>
    <string name="session_hold_time">Mantén: %1$d segundos</string>
    <string name="session_set_progress">Serie %1$d de %2$d</string>
    <string name="session_rest_time">Descanso: %1$d segundos</string>
    <string name="session_completed">¡Sesión completada!</string>
    <string name="session_score">Puntuación: %1$.0f%%</string>

    <!-- Calibration -->
    <string name="calibration_title">Calibración</string>
    <string name="calibration_instruction">Mantén tu rostro en posición neutral</string>
    <string name="calibration_success">Calibración exitosa</string>
    <string name="calibration_failed">Calibración fallida. Intenta de nuevo.</string>

    <!-- Errors -->
    <string name="error_generic">Ha ocurrido un error. Por favor, intenta de nuevo.</string>
    <string name="error_network">Error de conexión. Verifica tu conexión a internet.</string>
    <string name="error_camera_permission">Se requiere permiso de cámara para los ejercicios.</string>
    <string name="error_face_not_detected">No se detectó un rostro. Asegúrate de estar frente a la cámara.</string>

    <!-- Sync -->
    <string name="sync_pending">Sincronización pendiente</string>
    <string name="sync_in_progress">Sincronizando…</string>
    <string name="sync_completed">Sincronización completada</string>
    <string name="sync_failed">Error de sincronización</string>

    <!-- Plurals -->
    <plurals name="days_ago">
        <item quantity="one">Hace %1$d día</item>
        <item quantity="other">Hace %1$d días</item>
    </plurals>
    <plurals name="exercises_count">
        <item quantity="one">%1$d ejercicio</item>
        <item quantity="other">%1$d ejercicios</item>
    </plurals>
    <plurals name="sessions_count">
        <item quantity="one">%1$d sesión</item>
        <item quantity="other">%1$d sesiones</item>
    </plurals>

    <!-- Enums - Role -->
    <string name="enum_role_admin">Administrador</string>
    <string name="enum_role_therapist">Terapeuta</string>

    <!-- Enums - Gender -->
    <string name="enum_gender_male">Masculino</string>
    <string name="enum_gender_female">Femenino</string>
    <string name="enum_gender_other">Otro</string>

    <!-- Enums - PatientStatus -->
    <string name="enum_patient_status_active">Activo</string>
    <string name="enum_patient_status_inactive">Inactivo</string>
    <string name="enum_patient_status_archived">Archivado</string>

    <!-- Enums - ExerciseType -->
    <string name="enum_exercise_type_isotonic">Isotónico</string>
    <string name="enum_exercise_type_isometric">Isométrico</string>
    <string name="enum_exercise_type_manual">Manual</string>
    <string name="enum_exercise_type_relaxation">Relajación</string>

    <!-- Enums - ExerciseCategory -->
    <string name="enum_exercise_category_warmup">Calentamiento</string>
    <string name="enum_exercise_category_core">Principal</string>
    <string name="enum_exercise_category_cooldown">Enfriamiento</string>

    <!-- Enums - RoutineStatus -->
    <string name="enum_routine_status_active">Activa</string>
    <string name="enum_routine_status_archived">Archivada</string>

    <!-- Enums - MobileModule -->
    <string name="enum_mobile_module_eyes">Ojos</string>
    <string name="enum_mobile_module_eyes_inverse">Ojos (inverso)</string>
    <string name="enum_mobile_module_brows">Cejas</string>
    <string name="enum_mobile_module_jaw">Mandíbula</string>
    <string name="enum_mobile_module_smile">Sonrisa</string>
    <string name="enum_mobile_module_kiss">Beso</string>
</resources>
```

## Enum Translation Extensions

### apps/mobile/app/src/main/java/com/symma/app/i18n/EnumTranslations.kt

```kotlin
package com.symma.app.i18n

import android.content.Context
import androidx.annotation.StringRes
import com.symma.app.R
import com.symma.app.domain.model.*

// Extension functions for enum display names
fun Role.toDisplayName(context: Context): String = context.getString(
    when (this) {
        Role.ADMIN -> R.string.enum_role_admin
        Role.THERAPIST -> R.string.enum_role_therapist
    }
)

fun Gender.toDisplayName(context: Context): String = context.getString(
    when (this) {
        Gender.MALE -> R.string.enum_gender_male
        Gender.FEMALE -> R.string.enum_gender_female
        Gender.OTHER -> R.string.enum_gender_other
    }
)

fun PatientStatus.toDisplayName(context: Context): String = context.getString(
    when (this) {
        PatientStatus.ACTIVE -> R.string.enum_patient_status_active
        PatientStatus.INACTIVE -> R.string.enum_patient_status_inactive
        PatientStatus.ARCHIVED -> R.string.enum_patient_status_archived
    }
)

fun ExerciseType.toDisplayName(context: Context): String = context.getString(
    when (this) {
        ExerciseType.ISOTONIC -> R.string.enum_exercise_type_isotonic
        ExerciseType.ISOMETRIC -> R.string.enum_exercise_type_isometric
        ExerciseType.MANUAL -> R.string.enum_exercise_type_manual
        ExerciseType.RELAXATION -> R.string.enum_exercise_type_relaxation
    }
)

fun ExerciseCategory.toDisplayName(context: Context): String = context.getString(
    when (this) {
        ExerciseCategory.WARMUP -> R.string.enum_exercise_category_warmup
        ExerciseCategory.CORE -> R.string.enum_exercise_category_core
        ExerciseCategory.COOLDOWN -> R.string.enum_exercise_category_cooldown
    }
)

fun RoutineStatus.toDisplayName(context: Context): String = context.getString(
    when (this) {
        RoutineStatus.ACTIVE -> R.string.enum_routine_status_active
        RoutineStatus.ARCHIVED -> R.string.enum_routine_status_archived
    }
)

fun MobileModule.toDisplayName(context: Context): String = context.getString(
    when (this) {
        MobileModule.EYES -> R.string.enum_mobile_module_eyes
        MobileModule.EYES_INVERSE -> R.string.enum_mobile_module_eyes_inverse
        MobileModule.BROWS -> R.string.enum_mobile_module_brows
        MobileModule.JAW -> R.string.enum_mobile_module_jaw
        MobileModule.SMILE -> R.string.enum_mobile_module_smile
        MobileModule.KISS -> R.string.enum_mobile_module_kiss
    }
)
```

### Composable Helper

```kotlin
// apps/mobile/app/src/main/java/com/symma/app/i18n/EnumComposables.kt
package com.symma.app.i18n

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import com.symma.app.domain.model.*

@Composable
fun Role.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun Gender.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun PatientStatus.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun ExerciseType.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun ExerciseCategory.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun RoutineStatus.displayName(): String = toDisplayName(LocalContext.current)

@Composable
fun MobileModule.displayName(): String = toDisplayName(LocalContext.current)
```

## Usage in Jetpack Compose

```kotlin
// In a Composable function
@Composable
fun PatientCard(patient: Patient) {
    Column {
        Text(text = "${patient.firstName} ${patient.lastName}")
        Text(
            text = patient.status.displayName(),
            style = MaterialTheme.typography.bodySmall
        )
    }
}

// With plurals
@Composable
fun ExerciseCount(count: Int) {
    val context = LocalContext.current
    Text(
        text = context.resources.getQuantityString(
            R.plurals.exercises_count,
            count,
            count
        )
    )
}

// With string formatting
@Composable
fun SessionProgress(current: Int, total: Int) {
    Text(
        text = stringResource(R.string.session_set_progress, current, total)
    )
}
```

## Testing Contract

```kotlin
// apps/mobile/app/src/test/java/com/symma/app/i18n/EnumTranslationsTest.kt
package com.symma.app.i18n

import android.content.Context
import com.symma.app.R
import com.symma.app.domain.model.*
import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

class EnumTranslationsTest {
    
    private lateinit var context: Context
    
    @Before
    fun setup() {
        context = mockk()
        every { context.getString(R.string.enum_patient_status_active) } returns "Activo"
        every { context.getString(R.string.enum_patient_status_inactive) } returns "Inactivo"
        every { context.getString(R.string.enum_patient_status_archived) } returns "Archivado"
        // ... setup other mocks
    }
    
    @Test
    fun `PatientStatus ACTIVE returns Activo`() {
        assertEquals("Activo", PatientStatus.ACTIVE.toDisplayName(context))
    }
    
    @Test
    fun `PatientStatus INACTIVE returns Inactivo`() {
        assertEquals("Inactivo", PatientStatus.INACTIVE.toDisplayName(context))
    }
    
    @Test
    fun `PatientStatus ARCHIVED returns Archivado`() {
        assertEquals("Archivado", PatientStatus.ARCHIVED.toDisplayName(context))
    }
    
    @Test
    fun `all PatientStatus values have translations`() {
        PatientStatus.values().forEach { status ->
            // Should not throw
            status.toDisplayName(context)
        }
    }
}
```

## Future: Adding English Support

To add English support in the future:

1. Create `apps/mobile/app/src/main/res/values-en/strings.xml`
2. Copy all strings and translate to English
3. Android will automatically select based on device locale
