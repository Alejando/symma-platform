package com.symma.app.presentation.player

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
import com.symma.app.domain.repository.CalibrationRepository
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
import com.symma.app.presentation.components.camera.FaceLandmarkerHelper
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.logic.ExerciseStrategyFactory
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.ExerciseType
import com.google.mediapipe.tasks.components.containers.Category

private const val TAG = "PlayerVM"

/** Default countdown before starting (seconds) */
private const val GET_READY_DURATION = 5

/** Default rest duration if not specified in RoutineItem */
private const val DEFAULT_REST_SECONDS = 10

/**
 * Maximum frame delta allowed for hold-time accumulation.
 * Caps real-clock gaps (e.g., after pause or in unit tests) to prevent a single
 * large delta from completing a rep in one frame.
 */
private const val MAX_FRAME_DELTA_MS = 200L

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val routineRepository: RoutineRepository,
    private val calibrationRepository: CalibrationRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel(), FaceLandmarkerHelper.LandmarkerListener {
    
    // Optional routineId from navigation (currently using active routine from repository)
    private val routineId: String? = savedStateHandle["routineId"]
    
    private val _uiState = MutableStateFlow<PlayerUiState>(PlayerUiState.Loading)
    val uiState: StateFlow<PlayerUiState> = _uiState.asStateFlow()
    
    private val _events = MutableSharedFlow<PlayerEvent>(extraBufferCapacity = 10)
    val events: SharedFlow<PlayerEvent> = _events.asSharedFlow()

    private val _faceResult = MutableStateFlow<FaceLandmarkerHelper.ResultBundle?>(null)
    val faceResult: StateFlow<FaceLandmarkerHelper.ResultBundle?> = _faceResult.asStateFlow()

    // MOB-10: Symmetry Logic
    // private val symmetryCalculator = SymmetryCalculator() // DEPRECATED
    private val _symmetryScore = MutableStateFlow(0f)
    
    // Calibration Baseline (loaded from repository or default)
    private var calibrationBaseline: CalibrationBaseline = calibrationRepository.getBaseline() ?: CalibrationBaseline()
    val symmetryScore: StateFlow<Float> = _symmetryScore.asStateFlow()

    // MOB-12: Session Results & Sampling
    private val sessionResults = mutableListOf<SessionItemRequest>()
    private val currentExerciseScores = mutableListOf<Float>()
    private var lastSampleTime = 0L
    
    // Session tracking
    private var routine: Routine? = null
    private var routineItems: List<RoutineItem> = emptyList()
    private var currentExerciseIndex = 0
    private var isPaused = false
    private var sessionStartTime: Long = 0L
    
    // RFC-031: Clinical State Machine Variables
    private var currentSet = 1
    private var currentRep = 1
    private var completedRepsCount = 0 // Track actual reps completed (not just index)
    private var wasSkipped = false // Track if exercise was skipped
    private var accumulatedHoldTimeMs: Long = 0L
    private var isTargetReached = false
    private var wasTargetReached = false // For edge detection (Isotonic)
    private var lastFrameTime: Long = 0L
    /**
     * True after a rep completes until the score drops below the release threshold.
     * Blocks next-rep progression for both ISOMETRIC and ISOTONIC exercises.
     */
    private var awaitingRelease = false
    
    // Timer management
    private var timerJob: Job? = null
    private var frameProcessingEnabled = false
    
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
                    Log.d(TAG, "  [$index] ${item.exercise.name}: ${item.targetSets} sets x ${item.targetRepetitions} reps, hold=${item.holdTimeSeconds}s, rest=${item.restBetweenSetsSeconds}s")
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
        
        // Reload calibration to ensure fresh values (MOB-12)
        calibrationBaseline = calibrationRepository.getBaseline() ?: CalibrationBaseline()
        Log.v(TAG, "📐 Calibration loaded: smileMax=${calibrationBaseline.mouthSmileMax}, eyesClosedMax=${calibrationBaseline.eyesClosedMax}")
        
        sessionStartTime = System.currentTimeMillis()
        currentExerciseIndex = 0
        currentSet = 1
        currentRep = 1
        completedRepsCount = 0
        wasSkipped = false
        isPaused = false
        
        // Reset metrics
        sessionResults.clear()
        currentExerciseScores.clear()
        lastSampleTime = 0L
        
        startGetReadyCountdown()
    }
    
    /**
     * 5-second "Get Ready" countdown before starting exercises.
     */
    private fun startGetReadyCountdown() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            for (seconds in GET_READY_DURATION downTo 1) {
                _uiState.value = PlayerUiState.GetReady(seconds, GET_READY_DURATION)
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
        val config = currentItem.config
        
        Log.d(TAG, "💪 Starting Exercise: ${exercise.name} (Set $currentSet/${config.sets}, Rep $currentRep/${config.reps}, Hold: ${config.holdSeconds}s)")
        
        // Reset state for new exercise/rep
        accumulatedHoldTimeMs = 0L
        isTargetReached = false
        wasTargetReached = false
        // awaitingRelease is intentionally NOT reset here; it persists from the
        // previous rep completion until the score actually drops below releaseThreshold.
        // lastFrameTime = 0L sentinel: the first processFrame call will initialize it
        // from the incoming timestamp, avoiding a huge delta on the first frame.
        lastFrameTime = 0L
        frameProcessingEnabled = true
        
        // For Isometric exercises, we use frame-based hold tracking
        // For Isotonic, we use edge detection on target reached
        if (config.exerciseType == ExerciseType.ISOMETRIC) {
            startIsometricExercise(currentItem)
        } else {
            startIsotonicExercise(currentItem)
        }
    }
    
    /**
     * Isometric exercise: User must hold the target gesture for holdSeconds.
     * The hold timer is driven by frame processing, not a coroutine timer.
     */
    private fun startIsometricExercise(item: RoutineItem) {
        val config = item.config
        
        _uiState.value = PlayerUiState.Exercise(
            exerciseName = item.exercise.name,
            instruction = item.exercise.description,
            currentSet = currentSet,
            totalSets = config.sets,
            currentRep = currentRep,
            totalReps = config.reps,
            holdTimeLeft = config.holdSeconds,
            holdTimeTotal = config.holdSeconds,
            isTargetReached = false,
            isPaused = isPaused,
            isIsometric = true,
            completedSets = currentSet - 1,
            completedReps = currentRep - 1,
            awaitingRelease = awaitingRelease
        )
    }
    
    /**
     * Isotonic exercise: Rep completes when user reaches target (edge detection).
     */
    private fun startIsotonicExercise(item: RoutineItem) {
        val config = item.config
        
        _uiState.value = PlayerUiState.Exercise(
            exerciseName = item.exercise.name,
            instruction = item.exercise.description,
            currentSet = currentSet,
            totalSets = config.sets,
            currentRep = currentRep,
            totalReps = config.reps,
            holdTimeLeft = 0,
            holdTimeTotal = 0,
            isTargetReached = false,
            isPaused = isPaused,
            isIsometric = false,
            completedSets = currentSet - 1,
            completedReps = currentRep - 1,
            awaitingRelease = awaitingRelease
        )
    }
    
    /**
     * RFC-031: Process each frame from FaceLandmarker.
     * This drives the clinical state machine for Isometric exercises.
     */
    fun processFrame(score: Float, timestampMs: Long = System.currentTimeMillis()) {
        if (!frameProcessingEnabled || isPaused) return
        
        val currentItem = routineItems.getOrNull(currentExerciseIndex) ?: return
        val config = currentItem.config
        val currentState = _uiState.value
        
        if (currentState !is PlayerUiState.Exercise) return
        
        val now = timestampMs
        // If lastFrameTime is 0 (sentinel from startCurrentExercise), initialize it
        // from the current timestamp so the first frame contributes 0ms delta.
        val deltaTimeMs = if (lastFrameTime == 0L) 0L else (now - lastFrameTime).coerceIn(0L, MAX_FRAME_DELTA_MS)
        lastFrameTime = now
        
        // 1. Release gate: if awaiting release, check if score has dropped below threshold
        if (awaitingRelease) {
            if (score < config.releaseThreshold) {
                awaitingRelease = false
                Log.d(TAG, "🔓 Release detected (score=$score < ${config.releaseThreshold}), next rep unblocked")
            } else {
                // Still holding — update UI to show release-required state and return early
                val holdSecondsLeft = if (config.exerciseType == ExerciseType.ISOMETRIC) {
                    val remaining = (config.holdSeconds * 1000L - accumulatedHoldTimeMs).coerceAtLeast(0L)
                    (remaining / 1000).toInt()
                } else 0
                _uiState.value = currentState.copy(
                    holdTimeLeft = holdSecondsLeft,
                    isTargetReached = false,
                    awaitingRelease = true,
                    completedSets = currentSet - 1,
                    completedReps = currentRep - 1
                )
                return
            }
        }

        // 2. Check Target using configurable engage threshold
        val previousTargetReached = isTargetReached
        isTargetReached = score >= config.engageThreshold
        
        // Strict Mode: Reset hold time if user slips during isometric hold
        if (!isTargetReached && previousTargetReached && config.strictMode && config.exerciseType == ExerciseType.ISOMETRIC) {
            Log.d(TAG, "⚠️ Strict Mode: Target lost, resetting hold time")
            accumulatedHoldTimeMs = 0L
        }
        
        // 3. Time Accumulation (The "Hold")
        if (isTargetReached && config.exerciseType == ExerciseType.ISOMETRIC) {
            accumulatedHoldTimeMs += deltaTimeMs
        }
        
        // 4. Completion Logic
        var repCompleted = false
        
        when (config.exerciseType) {
            ExerciseType.ISOMETRIC -> {
                val holdTargetMs = config.holdSeconds * 1000L
                if (accumulatedHoldTimeMs >= holdTargetMs) {
                    repCompleted = true
                }
            }
            ExerciseType.ISOTONIC -> {
                // Edge detection: target was not reached, now it is
                if (!wasTargetReached && isTargetReached) {
                    repCompleted = true
                }
            }
        }
        
        wasTargetReached = isTargetReached
        
        // Update UI state with current hold progress
        val holdSecondsLeft = if (config.exerciseType == ExerciseType.ISOMETRIC) {
            val remaining = (config.holdSeconds * 1000L - accumulatedHoldTimeMs).coerceAtLeast(0L)
            (remaining / 1000).toInt()
        } else {
            0
        }
        
        _uiState.value = currentState.copy(
            holdTimeLeft = holdSecondsLeft,
            isTargetReached = isTargetReached,
            awaitingRelease = false,
            completedSets = currentSet - 1,
            completedReps = currentRep - 1
        )
        
        // Play tick sound in last 3 seconds
        if (config.exerciseType == ExerciseType.ISOMETRIC && holdSecondsLeft <= 3 && holdSecondsLeft > 0 && isTargetReached) {
            val previousSeconds = ((config.holdSeconds * 1000L - (accumulatedHoldTimeMs - deltaTimeMs)).coerceAtLeast(0L) / 1000).toInt()
            if (previousSeconds != holdSecondsLeft) {
                viewModelScope.launch { _events.emit(PlayerEvent.PlayTick) }
            }
        }
        
        // 4. Transition Logic (On Rep Complete)
        if (repCompleted) {
            onRepCompleted(currentItem)
        }
    }
    
    /**
     * RFC-031: Called when a single rep is completed.
     * Handles Set/Rep transitions and Rest states.
     */
    private fun onRepCompleted(item: RoutineItem) {
        val config = item.config
        
        Log.v(TAG, "✅ Rep $currentRep/${config.reps} completed! (Set $currentSet/${config.sets})")
        viewModelScope.launch { _events.emit(PlayerEvent.PlayDing) }
        
        // Track actual completion (MOB-12)
        completedRepsCount++

        // Reset accumulated hold time for next rep
        accumulatedHoldTimeMs = 0L
        isTargetReached = false
        wasTargetReached = false
        frameProcessingEnabled = false
        // Require release before next rep (applies to both ISOMETRIC and ISOTONIC)
        awaitingRelease = true
        
        if (currentRep < config.reps) {
            // More reps to go in current set
            currentRep++
            startCurrentExercise()
        } else {
            // All reps done for current set
            Log.d(TAG, "🎯 Set $currentSet/${config.sets} completed!")
            
            if (currentSet < config.sets) {
                // More sets to go - enter Rest state
                Log.d(TAG, "😴 Starting rest between sets...")
                startSetRestTimer(item)
            } else {
                // All sets done for this exercise
                Log.d(TAG, "🏆 Exercise ${item.exercise.name} fully completed!")
                moveToNextExercise()
            }
        }
    }
    
    /**
     * Rest timer between sets of the same exercise.
     */
    private fun startSetRestTimer(item: RoutineItem) {
        timerJob?.cancel()
        val restSeconds = item.config.restSeconds
        
        timerJob = viewModelScope.launch {
            var timeLeft = restSeconds
            
            while (timeLeft > 0) {
                while (isPaused) {
                    delay(100)
                }
                
                _uiState.value = PlayerUiState.Rest(
                    timeLeft = timeLeft,
                    nextExerciseName = "${item.exercise.name} - Set ${currentSet + 1}",
                    currentSet = currentSet,
                    totalSets = item.config.sets,
                    isSetRest = true
                )
                
                Log.d(TAG, "😴 Set Rest: $timeLeft seconds | Next: Set ${currentSet + 1}")
                
                if (timeLeft <= 3) {
                    _events.emit(PlayerEvent.PlayTick)
                }
                
                delay(1000)
                timeLeft--
            }
            
            // Rest completed, start next set
            currentSet++
            currentRep = 1
            Log.d(TAG, "✅ Rest completed, starting Set $currentSet")
            startCurrentExercise()
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
        // 1. SAVE RESULT OF COMPLETED EXERCISE
        val currentItem = routineItems.getOrNull(currentExerciseIndex)
        if (currentItem != null) {
            val averageAccuracy = if (currentExerciseScores.isNotEmpty()) {
                currentExerciseScores.average().toFloat()
            } else {
                null
            }
            
            val totalRepsCompleted = completedRepsCount
            sessionResults.add(
                SessionItemRequest(
                    exerciseId = currentItem.exercise.id,
                    repsCompleted = totalRepsCompleted, 
                    averageAccuracy = averageAccuracy
                    // skipped = wasSkipped // Eliminado porque no está en la API
                )
            )
            Log.d(TAG, "📊 Exercise Finished. Samples: ${currentExerciseScores.size}, Avg Accuracy: $averageAccuracy, Reps: $totalRepsCompleted, Skipped: $wasSkipped")
        }
        
        // 2. RESET STATE FOR NEXT EXERCISE
        currentExerciseScores.clear()
        currentExerciseIndex++
        currentSet = 1
        currentRep = 1
        completedRepsCount = 0
        wasSkipped = false
        
        if (currentExerciseIndex >= routineItems.size) {
            // All exercises completed!
            completeSession()
        } else {
            val nextItem = routineItems[currentExerciseIndex]
            Log.d(TAG, "➡️ Moving to next exercise: ${nextItem.exercise.name}")
            
            // Rest before next exercise (use completed exercise's rest config)
            val completedItem = routineItems.getOrNull(currentExerciseIndex - 1)
            val restTime = completedItem?.restBetweenSetsSeconds ?: DEFAULT_REST_SECONDS
            
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
        
        // Handle case where we finish abruptly or the last exercise was just completed naturally in moveToNextExercise
        // (moveToNextExercise already added the last result)
        
        val totalTimeSeconds = (System.currentTimeMillis() - sessionStartTime) / 1000
        
        Log.d(TAG, "🎉 SESSION COMPLETED!")
        Log.d(TAG, "  Routine ID: ${routine?.id}")
        Log.d(TAG, "  Total Exercises: ${routineItems.size}")
        Log.d(TAG, "  Total Time: ${totalTimeSeconds}s")
        Log.d(TAG, "  Results: $sessionResults")
        
        _uiState.value = PlayerUiState.Completed(
            routineId = routine?.id ?: "",
            totalExercises = routineItems.size,
            totalTimeSeconds = totalTimeSeconds
        )
        
        viewModelScope.launch {
            _events.emit(PlayerEvent.PlaySuccess)
        }
        
        // TODO: Trigger network upload here or in the UI layer based on the state
    }
    
    // ==================== PUBLIC CONTROLS ====================
    
    /**
     * Pauses the current timer (exercise or rest).
     */
    fun pause() {
        if (isPaused) return
        
        isPaused = true
        frameProcessingEnabled = false
        Log.d(TAG, "⏸️ Session PAUSED")
        
        // Update UI state to show paused
        val currentState = _uiState.value
        if (currentState is PlayerUiState.Exercise) {
            _uiState.value = currentState.copy(
                isPaused = true,
                completedSets = currentSet - 1,
                completedReps = currentRep - 1
            )
        }
    }
    
    /**
     * Resumes the current timer after pause.
     */
    fun resume() {
        if (!isPaused) return
        
        isPaused = false
        lastFrameTime = System.currentTimeMillis() // Reset frame time to avoid huge delta
        frameProcessingEnabled = true
        Log.d(TAG, "▶️ Session RESUMED")
        
        // Update UI state
        val currentState = _uiState.value
        if (currentState is PlayerUiState.Exercise) {
            _uiState.value = currentState.copy(
                isPaused = false,
                completedSets = currentSet - 1,
                completedReps = currentRep - 1
            )
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
                wasSkipped = true // Mark as skipped
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

    // ==================== FACE LANDMARKER LISTENER ====================

    override fun onError(error: String, errorCode: Int) {
        Log.e(TAG, "FaceLandmarker error ($errorCode): $error")
    }

    override fun onResults(resultBundle: FaceLandmarkerHelper.ResultBundle) {
        _faceResult.value = resultBundle
        
        // Use Blendshapes for Clinical Accuracy (RFC-028)
        val blendshapesOptional = resultBundle.result.faceBlendshapes()
        if (blendshapesOptional.isPresent) {
            val blendshapes = blendshapesOptional.get().firstOrNull()
            
            if (blendshapes != null) {
                // Calculate Score using module-based strategy
                var score = 0f
                val currentItem = routineItems.getOrNull(currentExerciseIndex)
                
                if (currentItem != null) {
                    val strategy = ExerciseStrategyFactory.getStrategy(currentItem.module)
                        ?: ExerciseStrategyFactory.getStrategy(currentItem.exercise.keyName)
                    if (strategy != null) {
                        score = strategy.calculateScore(blendshapes, calibrationBaseline, currentItem.difficulty)
                    } else {
                        Log.w(TAG, "⚠️ No strategy found for module=${currentItem.module}, keyName=${currentItem.exercise.keyName}")
                    }
                }
                
                // Debug: Log score periodically
                if (System.currentTimeMillis() % 1000 < 50) {
                    Log.v(TAG, "📊 Score: ${"%.2f".format(score)} | Target: ${if (score >= 1.0f) "✅ REACHED" else "❌"} | frameProcessing=$frameProcessingEnabled")
                }
                
                _symmetryScore.value = score
                
                // RFC-031: Process frame for clinical state machine
                processFrame(score)
                
                // SAMPLING LOGIC (MOB-12)
                val currentState = _uiState.value
                if (currentState is PlayerUiState.Exercise && !currentState.isPaused) {
                    val now = System.currentTimeMillis()
                    if (now - lastSampleTime >= 500) {
                        currentExerciseScores.add(score)
                        lastSampleTime = now
                    }
                }
            }
        }
    }
}
