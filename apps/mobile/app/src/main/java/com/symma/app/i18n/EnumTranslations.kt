package com.symma.app.i18n

import androidx.annotation.StringRes
import com.symma.app.R
import com.symma.app.domain.model.ExerciseCategory
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.Gender
import com.symma.app.domain.model.MobileModule
import com.symma.app.domain.model.PatientStatus
import com.symma.app.domain.model.Role
import com.symma.app.domain.model.RoutineStatus

@StringRes
fun Role.displayNameRes(): Int = when (this) {
    Role.ADMIN -> R.string.enum_role_admin
    Role.THERAPIST -> R.string.enum_role_therapist
}

@StringRes
fun Gender.displayNameRes(): Int = when (this) {
    Gender.MALE -> R.string.enum_gender_male
    Gender.FEMALE -> R.string.enum_gender_female
    Gender.OTHER -> R.string.enum_gender_other
}

@StringRes
fun PatientStatus.displayNameRes(): Int = when (this) {
    PatientStatus.ACTIVE -> R.string.enum_patient_status_active
    PatientStatus.INACTIVE -> R.string.enum_patient_status_inactive
    PatientStatus.ARCHIVED -> R.string.enum_patient_status_archived
}

@StringRes
fun ExerciseType.displayNameRes(): Int = when (this) {
    ExerciseType.ISOTONIC -> R.string.enum_exercise_type_isotonic
    ExerciseType.ISOMETRIC -> R.string.enum_exercise_type_isometric
    ExerciseType.MANUAL -> R.string.enum_exercise_type_manual
    ExerciseType.RELAXATION -> R.string.enum_exercise_type_relaxation
}

@StringRes
fun ExerciseCategory.displayNameRes(): Int = when (this) {
    ExerciseCategory.WARMUP -> R.string.enum_exercise_category_warmup
    ExerciseCategory.CORE -> R.string.enum_exercise_category_core
    ExerciseCategory.COOLDOWN -> R.string.enum_exercise_category_cooldown
}

@StringRes
fun RoutineStatus.displayNameRes(): Int = when (this) {
    RoutineStatus.ACTIVE -> R.string.enum_routine_status_active
    RoutineStatus.ARCHIVED -> R.string.enum_routine_status_archived
}

@StringRes
fun MobileModule.displayNameRes(): Int = when (this) {
    MobileModule.EYES -> R.string.enum_mobile_module_eyes
    MobileModule.EYES_INVERSE -> R.string.enum_mobile_module_eyes_inverse
    MobileModule.BROWS -> R.string.enum_mobile_module_brows
    MobileModule.JAW -> R.string.enum_mobile_module_jaw
    MobileModule.SMILE -> R.string.enum_mobile_module_smile
    MobileModule.KISS -> R.string.enum_mobile_module_kiss
    MobileModule.UNKNOWN -> R.string.enum_mobile_module_unknown
}
