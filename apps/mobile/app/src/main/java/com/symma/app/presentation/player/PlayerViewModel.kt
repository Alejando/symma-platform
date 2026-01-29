package com.symma.app.presentation.player

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
import com.symma.app.domain.repository.RoutineRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "PlayerVM"

/** Default countdown before starting (seconds) */
private const val GET_READY_DURATION = 5

/** Default rest duration if not specified in RoutineItem */
private const val DEFAULT_REST_SECONDS = 10

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val routineRepository: RoutineRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    
    // Optional routineId from navigation (currently using active routine from repository)
    private val routineId: String? = savedStateHandle["routineId"]
    
    private val _uiState = MutableStateFlow<PlayerUiState>(PlayerUiState.Loading)
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()
    
    private val _events = MutableSharedFlow<PlayerEvent>(extraBufferCapacity = 10)
    val events: SharedFlow<PlayerEvent> = _events.asSharedFlow()
    
    // Session tracking
    private var routine: Routine? = null
    private var routineItems: List<RoutineItem> = emptyList()
    private var currentExerciseIndex = 0
    private var currentRep = 1
    private var isPaused = false
    private var sessionStartTime: Long = 0L
    
    // Timer management
    private var timerJob: Job? = null
    
    init {
        Log.d(TAG, "🚀 PlayerViewModel initialized")
        loadRoutine()
    }
    
    /**
     * Reset the session and start from the beginning.
     * Called internally when data is loaded.
     */
    private fun loadRoutine() {
        viewModelScope.launch {
            Log.d(TAG, "📦 Loading routine from database...")
            _uiState.value = PlayerUiState.Loading
            
            try {
                // Get the first available routine from the flow
                val loadedRoutine = routineRepository.getRoutineFlow().first()
                
                if (loadedRoutine == null) {
                    Log.e(TAG, "❌ No routine found in database!")
                    return@launch
                }
                
                routine = loadedRoutine
                routineItems = loadedRoutine.items.sortedBy { it.orderIndex }
                
                Log.d(TAG, "✅ Loaded routine: ${loadedRoutine.name} with ${routineItems.size} exercises")
                routineItems.forEachIndexed { index, item ->
                    Log.d(TAG, "  [$index] ${item.exercise.name}: ${item.targetRepetitions} reps x ${item.holdTimeSeconds}s hold")
                }
                
                if (routineItems.isEmpty()) {
                    Log.e(TAG, "❌ Routine has no items!")
                    return@launch
                }
                
                // Start the session
                startSession()
                
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to load routine: ${e.message}")
            }
        }
    }
    
    /**
     * Starts the session with the GetReady countdown.
     */
    private fun startSession() {
        Log.d(TAG, "🏁 Starting session...")
        sessionStartTime = System.currentTimeMillis()
        currentExerciseIndex = 0
        currentRep = 1
        isPaused = false
        
        startGetReadyCountdown()
    }
    
    /**
     * 5-second "Get Ready" countdown before starting exercises.
     */
    private fun startGetReadyCountdown() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            for (seconds in GET_READY_DURATION downTo 1) {
                _uiState.value = PlayerUiState.GetReady(seconds)
                Log.d(TAG, "⏱️ GetReady: $seconds")
                _events.emit(PlayerEvent.PlayTick)
                delay(1000)
            }
            
            // Transition to first exercise
            startCurrentExercise()
        }
    }
    
    /**
     * Starts or resumes the current exercise with its hold timer.
     */
    private fun startCurrentExercise() {
        val currentItem = routineItems.getOrNull(currentExerciseIndex) ?: run {
            Log.e(TAG, "❌ Invalid exercise index: $currentExerciseIndex")
            completeSession()
            return
        }
        
        val exercise = currentItem.exercise
        val totalReps = currentItem.targetRepetitions
        val holdTime = currentItem.holdTimeSeconds
        
        Log.d(TAG, "💪 Starting Exercise: ${exercise.name} (Rep $currentRep/$totalReps, Hold: ${holdTime}s)")
        
        startExerciseTimer(currentItem)
    }
    
    /**
     * Timer for the exercise hold duration.
     */
    private fun startExerciseTimer(item: RoutineItem) {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            var timeLeft = item.holdTimeSeconds
            
            while (timeLeft > 0) {
                // Check if paused
                while (isPaused) {
                    delay(100)
                }
                
                _uiState.value = PlayerUiState.Exercise(
                    exerciseName = item.exercise.name,
                    instruction = item.exercise.description,
                    currentRep = currentRep,
                    totalReps = item.targetRepetitions,
                    timeLeft = timeLeft,
                    isPaused = isPaused
                )
                
                Log.d(TAG, "⏱️ Exercise: ${item.exercise.name} | Rep $currentRep/${item.targetRepetitions} | Time: $timeLeft")
                
                if (timeLeft <= 3) {
                    _events.emit(PlayerEvent.PlayTick)
                }
                
                delay(1000)
                timeLeft--
            }
            
            // Rep completed!
            Log.d(TAG, "✅ Rep $currentRep completed!")
            _events.emit(PlayerEvent.PlayDing)
            
            onRepCompleted(item)
        }
    }
    
    /**
     * Called when a single rep timer hits zero.
     * Decides whether to rest, do next rep, or move to next exercise.
     */
    private fun onRepCompleted(item: RoutineItem) {
        val totalReps = item.targetRepetitions
        
        if (currentRep < totalReps) {
            // More reps to go
            currentRep++
            
            val restTime = item.restBetweenSetsSeconds ?: 0
            if (restTime > 0) {
                // Go to rest state
                startRestTimer(restTime, item.exercise.name)
            } else {
                // No rest, start next rep immediately
                Log.d(TAG, "➡️ No rest configured, starting next rep immediately")
                startCurrentExercise()
            }
        } else {
            // All reps done for this exercise
            Log.d(TAG, "🎯 All ${totalReps} reps completed for ${item.exercise.name}!")
            moveToNextExercise()
        }
    }
    
    /**
     * Rest timer between reps or exercises.
     * @param restSeconds Duration of rest
     * @param nextUpName Name of the exercise/rep coming up next
     */
    private fun startRestTimer(restSeconds: Int, nextUpName: String) {
        timerJob?.cancel()
        
        timerJob = viewModelScope.launch {
            var timeLeft = restSeconds
            
            while (timeLeft > 0) {
                // Check if paused
                while (isPaused) {
                    delay(100)
                }
                
                _uiState.value = PlayerUiState.Rest(
                    timeLeft = timeLeft,
                    nextExerciseName = nextUpName
                )
                
                Log.d(TAG, "😴 Rest: $timeLeft seconds | Next: $nextUpName")
                
                if (timeLeft <= 3) {
                    _events.emit(PlayerEvent.PlayTick)
                }
                
                delay(1000)
                timeLeft--
            }
            
            // Rest completed, resume exercise
            Log.d(TAG, "✅ Rest completed, resuming...")
            startCurrentExercise()
        }
    }
    
    /**
     * Advances to the next exercise in the routine.
     */
    private fun moveToNextExercise() {
        currentExerciseIndex++
        currentRep = 1
        
        if (currentExerciseIndex >= routineItems.size) {
            // All exercises completed!
            completeSession()
        } else {
            val nextItem = routineItems[currentExerciseIndex]
            Log.d(TAG, "➡️ Moving to next exercise: ${nextItem.exercise.name}")
            
            // Add a brief rest before next exercise (using its rest time or default)
            val restTime = routineItems.getOrNull(currentExerciseIndex - 1)?.restBetweenSetsSeconds 
                ?: DEFAULT_REST_SECONDS
            
            if (restTime > 0) {
                startRestTimer(restTime, nextItem.exercise.name)
            } else {
                startCurrentExercise()
            }
        }
    }
    
    /**
     * Marks the session as completed.
     */
    private fun completeSession() {
        timerJob?.cancel()
        
        val totalTimeSeconds = (System.currentTimeMillis() - sessionStartTime) / 1000
        
        Log.d(TAG, "🎉 SESSION COMPLETED!")
        Log.d(TAG, "  Total Exercises: ${routineItems.size}")
        Log.d(TAG, "  Total Time: ${totalTimeSeconds}s")
        
        _uiState.value = PlayerUiState.Completed(
            routineId = routine?.id ?: "",
            totalExercises = routineItems.size,
            totalTimeSeconds = totalTimeSeconds
        )
        
        viewModelScope.launch {
            _events.emit(PlayerEvent.PlaySuccess)
        }
    }
    
    // ==================== PUBLIC CONTROLS ====================
    
    /**
     * Pauses the current timer (exercise or rest).
     */
    fun pause() {
        if (isPaused) return
        
        isPaused = true
        Log.d(TAG, "⏸️ Session PAUSED")
        
        // Update UI state to show paused
        val currentState = _uiState.value
        if (currentState is PlayerUiState.Exercise) {
            _uiState.value = currentState.copy(isPaused = true)
        }
    }
    
    /**
     * Resumes the current timer after pause.
     */
    fun resume() {
        if (!isPaused) return
        
        isPaused = false
        Log.d(TAG, "▶️ Session RESUMED")
        
        // Update UI state
        val currentState = _uiState.value
        if (currentState is PlayerUiState.Exercise) {
            _uiState.value = currentState.copy(isPaused = false)
        }
    }
    
    /**
     * Toggles pause/resume state.
     */
    fun togglePause() {
        if (isPaused) resume() else pause()
    }
    
    /**
     * Skips the current exercise and moves to the next one.
     */
    fun skip() {
        Log.d(TAG, "⏭️ Skipping current exercise...")
        
        val currentState = _uiState.value
        when (currentState) {
            is PlayerUiState.GetReady -> {
                // Skip get ready, start first exercise
                timerJob?.cancel()
                startCurrentExercise()
            }
            is PlayerUiState.Exercise, is PlayerUiState.Rest -> {
                // Skip to next exercise
                timerJob?.cancel()
                moveToNextExercise()
            }
            else -> {
                Log.d(TAG, "⚠️ Cannot skip in current state: $currentState")
            }
        }
    }
    
    /**
     * Restarts the entire session from the beginning.
     */
    fun restart() {
        Log.d(TAG, "🔄 Restarting session...")
        timerJob?.cancel()
        startSession()
    }
    
    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
        Log.d(TAG, "🧹 PlayerViewModel cleared")
    }
}
