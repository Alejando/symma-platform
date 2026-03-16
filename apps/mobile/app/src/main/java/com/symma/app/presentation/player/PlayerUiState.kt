package com.symma.app.presentation.player

import com.symma.app.domain.model.Exercise

/**
 * Sealed interface representing all possible UI states during a therapy session.
 * The Player follows a state machine: Loading -> GetReady -> Exercise <-> Rest -> Completed
 */
sealed interface PlayerUiState {
    
    /**
     * Initial state while loading routine data from Room database.
     */
    data object Loading : PlayerUiState
    
    /**
     * Pre-session countdown (typically 5 seconds) to prepare the patient.
     */
    data class GetReady(
        val countdownSeconds: Int,
        val totalSeconds: Int = 5
    ) : PlayerUiState
    
    /**
     * Active exercise state where the patient performs the movement/hold.
     * 
     * @param exerciseName Name of the current exercise
     * @param instruction Optional instruction text for the exercise
     * @param currentSet Current set number (1-based)
     * @param totalSets Total sets to complete for this exercise
     * @param currentRep Current repetition number (1-based)
     * @param totalReps Total repetitions to complete per set
     * @param holdTimeLeft Remaining hold time in seconds (for Isometric)
     * @param holdTimeTotal Total hold time required per rep (for Isometric)
     * @param isTargetReached Whether user has reached the target gesture
     * @param isPaused Whether the session is currently paused
     * @param isIsometric Whether this is an isometric (hold) exercise
     */
    data class Exercise(
        val exerciseName: String,
        val instruction: String?,
        val currentSet: Int,
        val totalSets: Int,
        val currentRep: Int,
        val totalReps: Int,
        val holdTimeLeft: Int,
        val holdTimeTotal: Int,
        val isTargetReached: Boolean,
        val isPaused: Boolean,
        val isIsometric: Boolean,
        val completedSets: Int,
        val completedReps: Int,
        /** True when a rep just completed and the patient must relax before the next rep starts. */
        val awaitingRelease: Boolean = false
    ) : PlayerUiState {
        @Deprecated("Use holdTimeLeft instead", ReplaceWith("holdTimeLeft"))
        val timeLeft: Int get() = holdTimeLeft
    }
    
    /**
     * Rest period between sets or exercises.
     * 
     * @param timeLeft Remaining rest time in seconds
     * @param nextExerciseName Name of the next exercise for preview
     * @param currentSet Current set just completed
     * @param totalSets Total sets for this exercise
     * @param isSetRest True if resting between sets, false if between exercises
     */
    data class Rest(
        val timeLeft: Int,
        val nextExerciseName: String,
        val currentSet: Int = 1,
        val totalSets: Int = 1,
        val isSetRest: Boolean = false
    ) : PlayerUiState
    
    /**
     * Session completed state with summary metrics.
     * 
     * @param totalExercises Total exercises completed
     * @param totalTimeSeconds Total session duration in seconds
     */
    data class Completed(
        val routineId: String,
        val totalExercises: Int,
        val totalTimeSeconds: Long
    ) : PlayerUiState
}

/**
 * Side effect events emitted by PlayerViewModel for audio/haptic feedback.
 * These are one-shot events that should be consumed only once by the UI.
 */
sealed interface PlayerEvent {
    /** Tick sound for each second countdown */
    data object PlayTick : PlayerEvent
    
    /** Ding sound when a rep is completed */
    data object PlayDing : PlayerEvent
    
    /** Success sound when the entire session is completed */
    data object PlaySuccess : PlayerEvent
}
