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
        val countdownSeconds: Int
    ) : PlayerUiState
    
    /**
     * Active exercise state where the patient performs the movement/hold.
     * 
     * @param exerciseName Name of the current exercise
     * @param instruction Optional instruction text for the exercise
     * @param currentRep Current repetition number (1-based)
     * @param totalReps Total repetitions to complete for this exercise
     * @param timeLeft Remaining hold time in seconds
     * @param isPaused Whether the session is currently paused
     */
    data class Exercise(
        val exerciseName: String,
        val instruction: String?,
        val currentRep: Int,
        val totalReps: Int,
        val timeLeft: Int,
        val isPaused: Boolean
    ) : PlayerUiState
    
    /**
     * Rest period between repetitions or exercises.
     * 
     * @param timeLeft Remaining rest time in seconds
     * @param nextExerciseName Name of the next exercise for preview
     */
    data class Rest(
        val timeLeft: Int,
        val nextExerciseName: String
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
