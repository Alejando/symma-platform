package com.symma.app.i18n

import com.symma.app.domain.model.Role
import com.symma.app.domain.model.Gender
import com.symma.app.domain.model.PatientStatus
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.ExerciseCategory
import com.symma.app.domain.model.RoutineStatus
import com.symma.app.domain.model.MobileModule

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
    MobileModule.EYES_INVERSE -> "Ojos Inverso"
    MobileModule.BROWS -> "Cejas"
    MobileModule.JAW -> "Mandíbula"
    MobileModule.SMILE -> "Sonrisa"
    MobileModule.KISS -> "Beso"
    MobileModule.UNKNOWN -> "Desconocido"
}
