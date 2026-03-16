package com.symma.app.domain.model

import com.symma.app.domain.logic.REP_ENGAGE_THRESHOLD
import com.symma.app.domain.logic.REP_RELEASE_THRESHOLD

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
    val allowSkip: Boolean = true,
    /** Score threshold to consider the gesture target reached. */
    val engageThreshold: Float = REP_ENGAGE_THRESHOLD,
    /**
     * Score threshold below which the gesture is considered released.
     * Must be strictly less than [engageThreshold] to provide hysteresis.
     */
    val releaseThreshold: Float = REP_RELEASE_THRESHOLD
) {
    init {
        require(releaseThreshold < engageThreshold) {
            "releaseThreshold ($releaseThreshold) must be < engageThreshold ($engageThreshold)"
        }
    }
}
