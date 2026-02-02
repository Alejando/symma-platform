package com.symma.app.domain.model

/**
 * Module mapping for exercise types on mobile.
 * Determines which strategy to use for score calculation.
 */
enum class MobileModule {
    EYES,
    EYES_INVERSE,
    BROWS,
    JAW,
    SMILE,
    KISS,
    UNKNOWN
}

/**
 * Exercise type determining repetition behavior.
 * - ISOTONIC: Count-based reps (reach target, rep completes)
 * - ISOMETRIC: Time-based holds (hold target for duration)
 */
enum class ExerciseType {
    ISOTONIC,
    ISOMETRIC
}

/**
 * Configuration for exercise execution parameters.
 * Maps backend response to structured config for the clinical engine.
 */
data class ExerciseConfig(
    val exerciseType: ExerciseType = ExerciseType.ISOMETRIC,
    val sets: Int = 1,
    val reps: Int = 10,
    val restSeconds: Int = 5,
    val holdSeconds: Int = 3,
    val strictMode: Boolean = false,
    val allowSkip: Boolean = true
)
