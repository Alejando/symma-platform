package com.symma.app.domain.model

data class RoutineItem(
    val id: String,
    val orderIndex: Int,
    val targetRepetitions: Int,
    val targetSets: Int,
    val holdTimeSeconds: Int,
    val restBetweenSetsSeconds: Int?,
    val difficulty: Float = 1.0f,
    val strictMode: Boolean = false,
    val exercise: Exercise
) {
    /**
     * Maps backend flat columns to structured ExerciseConfig.
     */
    val config: ExerciseConfig
        get() = ExerciseConfig(
            exerciseType = if (holdTimeSeconds > 0) ExerciseType.ISOMETRIC else ExerciseType.ISOTONIC,
            sets = targetSets.coerceAtLeast(1),
            reps = targetRepetitions.coerceAtLeast(1),
            restSeconds = restBetweenSetsSeconds ?: 5,
            holdSeconds = holdTimeSeconds.coerceAtLeast(0),
            strictMode = strictMode,
            allowSkip = true
        )

    /**
     * Maps exercise mobileModule to MobileModule enum for strategy selection.
     * Falls back to keyName-based inference if mobileModule is not set.
     */
    val module: MobileModule
        get() {
            // Primary: Use mobileModule from backend if available
            exercise.mobileModule?.let { moduleStr ->
                return when (moduleStr.uppercase()) {
                    "SMILE" -> MobileModule.SMILE
                    "BROWS" -> MobileModule.BROWS
                    "JAW" -> MobileModule.JAW
                    "KISS" -> MobileModule.KISS
                    "EYES" -> MobileModule.EYES
                    "EYES_INVERSE" -> MobileModule.EYES_INVERSE
                    else -> MobileModule.UNKNOWN
                }
            }
            // Fallback: Infer from keyName (legacy support)
            return when (exercise.keyName.lowercase()) {
                "eyes", "eye_close", "blink" -> MobileModule.EYES
                "eyes_inverse", "eye_open", "wide_eyes" -> MobileModule.EYES_INVERSE
                "brows", "eyebrows", "brow_raise" -> MobileModule.BROWS
                "jaw", "jaw_open", "mouth_open" -> MobileModule.JAW
                "smile", "mouth_smile" -> MobileModule.SMILE
                "kiss", "pucker", "duck_face" -> MobileModule.KISS
                else -> MobileModule.UNKNOWN
            }
        }
}
