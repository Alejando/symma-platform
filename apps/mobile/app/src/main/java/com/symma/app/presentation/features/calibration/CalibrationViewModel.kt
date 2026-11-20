package com.symma.app.presentation.features.calibration

import android.graphics.RectF
import android.os.SystemClock
import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.symma.app.domain.logic.CALIBRATION_MIN_VALID_SAMPLES
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_BROW_RAISE
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_DEFAULT
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_EYES_CLOSED
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_EYES_WIDE
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_JAW_OPEN
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_KISS
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_SMILE
import com.symma.app.domain.logic.CalibrationUtils
import com.symma.app.domain.logic.CaptureWindow
import com.symma.app.domain.logic.HeadPose
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.MobileModule
import com.symma.app.domain.repository.CalibrationRepository
import com.symma.app.domain.repository.RoutineRepository
import com.symma.app.presentation.components.camera.FaceLandmarkerHelper
import com.symma.app.presentation.components.camera.VisionPerformanceSnapshot
import com.symma.app.domain.logic.DistanceState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/** RF-054: every wizard step captures for three seconds. */
private const val CAPTURE_WINDOW_MS = 3_000L
private const val MAX_FRAME_GAP_MS = 200L
private const val DISTANCE_OK_REQUIRED_MS = 1000L

@HiltViewModel
class CalibrationViewModel @Inject constructor(
    private val calibrationRepository: CalibrationRepository,
    private val routineRepository: RoutineRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val routineId: String? = savedStateHandle["routineId"]

    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState.asStateFlow()

    private val savedBaseline: CalibrationBaseline = calibrationRepository.getBaseline() ?: CalibrationBaseline()
    private var currentBaseline = savedBaseline
    private val calibratedGestureKeys = mutableSetOf<String>()
    
    // Sample buffers for statistical analysis
    private val neutralSamples = mutableMapOf<String, MutableList<Float>>()
    private val activeSamples = mutableListOf<Float>()
    
    private val captureWindow = CaptureWindow(CAPTURE_WINDOW_MS, MAX_FRAME_GAP_MS)

    private var previousFaceBox: RectF? = null

    private var distanceOkStartTime: Long? = null

    private var requiredSteps: List<CalibrationStep> = wizardStepsFor(emptySet())
    
    init {
        loadRoutineSteps()
    }
    
    private fun loadRoutineSteps() {
        val targetRoutineId = routineId ?: return
        viewModelScope.launch {
            try {
                val routine = routineRepository.getRoutineFlow().firstOrNull()
                if (routine == null || routine.id != targetRoutineId) {
                    Log.w(TAG, "Routine $targetRoutineId not found, using the documented wizard only")
                    return@launch
                }
                requiredSteps = wizardStepsFor(routine.items.map { item -> item.module }.toSet())
            } catch (e: Exception) {
                Log.e(TAG, "Error loading routine for calibration, using the documented wizard only", e)
            }
        }
    }

    /** Low-amplitude gestures (brows, eyes) use a lower floor than mouth gestures, where 0.15 lets resting noise through. */
    private fun thresholdForStep(step: CalibrationStep): Float = when (step) {
        CalibrationStep.Surprise -> CALIBRATION_THRESHOLD_BROW_RAISE
        CalibrationStep.EyesClosed -> CALIBRATION_THRESHOLD_EYES_CLOSED
        CalibrationStep.EyesWide -> CALIBRATION_THRESHOLD_EYES_WIDE
        CalibrationStep.Smile -> CALIBRATION_THRESHOLD_SMILE
        CalibrationStep.JawOpen -> CALIBRATION_THRESHOLD_JAW_OPEN
        CalibrationStep.Kiss -> CALIBRATION_THRESHOLD_KISS
        else -> CALIBRATION_THRESHOLD_DEFAULT
    }

    /**
     * Configure the minimum gesture threshold for this calibration session.
     * Kept for external callers; updates the UI state threshold for the current step.
     * @param threshold Value between 0.0 and 1.0 (e.g., 0.15 = 15%)
     */
    fun setGestureThreshold(threshold: Float) {
        val clamped = threshold.coerceIn(0.05f, 0.5f)
        _uiState.update { it.copy(minGestureThreshold = clamped) }
    }

    fun onFaceDetected(isDetected: Boolean, faceBox: RectF? = null, imageWidth: Int = 0, imageHeight: Int = 0) {
        val currentPhase = _uiState.value.phase
        if (currentPhase == CalibrationPhase.POSITIONING) {
            // Use image dimensions for ratio calculation (face box is in image coordinates)
            val effectiveWidth = if (imageWidth > 0) imageWidth else _uiState.value.screenWidth
            val effectiveHeight = if (imageHeight > 0) imageHeight else _uiState.value.screenHeight
            val distanceState = CalibrationUtils.isDistanceCorrect(faceBox, effectiveWidth, effectiveHeight)
            
            // Calculate debug ratio
            val faceAreaRatio = if (faceBox != null && effectiveWidth > 0 && effectiveHeight > 0) {
                val faceArea = faceBox.width() * faceBox.height()
                val imageArea = effectiveWidth.toFloat() * effectiveHeight.toFloat()
                faceArea / imageArea
            } else 0f
            
            // Check if face is in position (centered) - use image coordinates
            val isInPosition = faceBox != null && CalibrationUtils.isFaceInPosition(
                faceBox = faceBox,
                screenWidth = effectiveWidth,
                screenHeight = effectiveHeight
            )
            
            // Track how long distance has been OK
            val now = SystemClock.elapsedRealtime()
            val isDistanceOk = distanceState == DistanceState.OK
            
            if (isDistanceOk && isInPosition) {
                if (distanceOkStartTime == null) {
                    distanceOkStartTime = now
                }
            } else {
                distanceOkStartTime = null
            }
            
            // Calculate if user has been at correct distance for required duration
            val distanceOkDuration = distanceOkStartTime?.let { now - it } ?: 0L
            val isReadyToStart = distanceOkDuration >= DISTANCE_OK_REQUIRED_MS
            
            val debugBoxInfo = faceBox?.let { 
                "W:${it.width().toInt()} H:${it.height().toInt()} Img:${effectiveWidth}x${effectiveHeight}"
            } ?: "No face"
            
            _uiState.update { 
                it.copy(
                    isFaceDetected = isDetected,
                    isFaceInPosition = isInPosition && isDistanceOk,
                    distanceState = distanceState,
                    distanceOkProgress = (distanceOkDuration.toFloat() / DISTANCE_OK_REQUIRED_MS).coerceIn(0f, 1f),
                    isReadyToStart = isReadyToStart,
                    debugFaceAreaRatio = faceAreaRatio,
                    debugFaceBox = debugBoxInfo
                ) 
            }
        }
    }

    /** MediaPipe delivers results on its own thread; calibration state only changes on the main dispatcher. */
    fun onLandmarkerResult(resultBundle: FaceLandmarkerHelper.ResultBundle) {
        viewModelScope.launch {
            val result = resultBundle.result
            val imageWidth = resultBundle.inputImageWidth
            val imageHeight = resultBundle.inputImageHeight
            _uiState.update { it.copy(visionPerformance = resultBundle.performance) }
            val landmarks = result.faceLandmarks().firstOrNull()
            val faceBox = landmarks?.let { CalibrationUtils.getFaceBoundingBox(it, imageWidth, imageHeight) }
            onFaceDetected(landmarks != null, faceBox, imageWidth, imageHeight)
            processFrame(result, imageWidth, imageHeight)
        }
    }

    fun setScreenDimensions(width: Int, height: Int) {
        _uiState.update { it.copy(screenWidth = width, screenHeight = height) }
    }

    fun startCalibration() {
        if (!_uiState.value.isReadyToStart) return
        
        // Reset state and move to Neutral capture
        neutralSamples.clear()
        gestureReadings.keys.forEach { key -> neutralSamples[key] = mutableListOf() }
        
        previousFaceBox = null
        captureWindow.restart()

        _uiState.update {
            it.copy(
                phase = CalibrationPhase.NEUTRAL_CAPTURE,
                currentStep = CalibrationStep.Neutral,
                captureProgress = 0f,
                isHeadStable = true,
                framesCaptured = 0,
                isRetryingStep = false,
                currentStepNumber = 1,
                totalSteps = requiredSteps.count { step -> step != CalibrationStep.Complete }
            )
        }
    }

    fun processFrame(
        result: FaceLandmarkerResult,
        imageWidth: Int,
        imageHeight: Int,
        timestampMs: Long = result.timestampMs()
    ) {
        val phase = _uiState.value.phase
        val step = _uiState.value.currentStep
        
        if (phase == CalibrationPhase.POSITIONING || phase == CalibrationPhase.COMPLETE) {
            return
        }

        val blendshapesOptional = result.faceBlendshapes()
        if (!blendshapesOptional.isPresent) {
            Log.d(TAG, "processFrame: no blendshapes for phase=$phase, step=$step")
            return
        }
        
        val categories = blendshapesOptional.get().firstOrNull() ?: return
        val landmarks = result.faceLandmarks().firstOrNull() ?: return
        
        // Get face bounding box for stability check
        val currentFaceBox = CalibrationUtils.getFaceBoundingBox(landmarks, imageWidth, imageHeight)
        
        val isTranslationStable = if (previousFaceBox != null && currentFaceBox != null) {
            CalibrationUtils.isHeadStable(currentFaceBox, previousFaceBox)
        } else {
            true
        }
        previousFaceBox = currentFaceBox
        val isHeadRotated = isHeadTurnedAwayFromCamera(result)
        val isStable = isTranslationStable && !isHeadRotated
        captureWindow.onFrame(timestampMs, isSteady = isStable)

        _uiState.update { it.copy(isHeadStable = isStable, isHeadRotated = isHeadRotated) }

        // Helper to extract blendshape scores
        fun getScore(name: String): Float {
            return categories.find { it.categoryName() == name }?.score() ?: 0f
        }

        when (phase) {
            CalibrationPhase.NEUTRAL_CAPTURE -> processNeutralFrame(::getScore, isStable)
            CalibrationPhase.ACTIVE_CAPTURE -> processActiveFrame(::getScore, isStable)
            else -> {}
        }
    }

    private fun isHeadTurnedAwayFromCamera(result: FaceLandmarkerResult): Boolean {
        val matrix = result.facialTransformationMatrixes().orElse(null)?.firstOrNull() ?: return false
        val pose = HeadPose.fromTransformationMatrix(matrix) ?: return false
        return pose.isTurnedAwayFromCamera()
    }

    private fun processNeutralFrame(getScore: (String) -> Float, isStable: Boolean) {
        if (isStable) {
            gestureReadings.forEach { (key, reading) -> neutralSamples[key]?.add(reading(getScore)) }
        }
        val validSamples = neutralSamples[CalibrationBaseline.KEY_JAW_OPEN]?.size ?: 0
        publishCaptureProgress(validSamples)
        if (captureWindow.isComplete) {
            if (validSamples >= CALIBRATION_MIN_VALID_SAMPLES) completeNeutralPhase() else retryCurrentStep()
        }
    }

    private fun publishCaptureProgress(validSamples: Int) {
        _uiState.update {
            it.copy(
                captureProgress = captureWindow.progress,
                framesCaptured = validSamples,
                isRetryingStep = it.isRetryingStep && validSamples == 0
            )
        }
    }

    /** A window with too few valid frames would yield a P95 of noise, so the step is captured again. */
    private fun retryCurrentStep() {
        Log.w(TAG, "Step ${_uiState.value.currentStep} ended with too few valid samples, retrying")
        neutralSamples.values.forEach { samples -> samples.clear() }
        activeSamples.clear()
        captureWindow.restart()
        _uiState.update { it.copy(captureProgress = 0f, framesCaptured = 0, isRetryingStep = true) }
    }

    private fun completeNeutralPhase() {
        val freshOffsets = neutralSamples.mapValues { (_, samples) -> CalibrationUtils.calculateAverage(samples) }
        currentBaseline = currentBaseline.copy(neutralOffsets = mergeNeutralOffsets(freshOffsets))
        
        // Update baseline in state BEFORE starting active capture
        _uiState.update { 
            it.copy(currentBaseline = currentBaseline) 
        }
        
        // Move to first active capture step (this sets stepCompleted = false)
        advanceToNextStep()
    }

    /** A module's tare and its max are measured together; a module left out of this run keeps its saved pair. */
    private fun mergeNeutralOffsets(freshOffsets: Map<String, Float>): Map<String, Float> {
        val keysBeingCalibrated = requiredSteps.mapNotNull { it.gestureKey }.toSet()
        val preserved = savedBaseline.neutralOffsets.filterKeys { it !in keysBeingCalibrated }
        return freshOffsets + preserved
    }

    private fun startActiveCapture(step: CalibrationStep) {
        activeSamples.clear()
        previousFaceBox = null
        captureWindow.restart()

        val stepIndex = requiredSteps.indexOf(step).coerceAtLeast(0)
        val stepsBeforeComplete = requiredSteps.size - 1
        val globalProgress = if (stepsBeforeComplete > 0) stepIndex.toFloat() / stepsBeforeComplete else 0f

        _uiState.update {
            it.copy(
                phase = CalibrationPhase.ACTIVE_CAPTURE,
                currentStep = step,
                captureProgress = 0f,
                globalProgress = globalProgress,
                isHeadStable = true,
                stepCompleted = false,
                framesCaptured = 0,
                isRetryingStep = false,
                currentStepNumber = stepIndex + 1
            )
        }
    }

    private fun processActiveFrame(getScore: (String) -> Float, isStable: Boolean) {
        val step = _uiState.value.currentStep
        if (_uiState.value.stepCompleted) return
        val gestureKey = step.gestureKey ?: return

        if (isStable) {
            val rawValue = gestureReadings.getValue(gestureKey)(getScore)
            val correctedValue = (rawValue - currentBaseline.getNeutralOffset(gestureKey)).coerceAtLeast(0f)
            val stepThreshold = thresholdForStep(step)
            val meetsThreshold = correctedValue >= stepThreshold
            if (meetsThreshold) activeSamples.add(correctedValue)
            _uiState.update {
                it.copy(
                    currentRawValue = rawValue,
                    currentCorrectedValue = correctedValue,
                    isGestureIntensitySufficient = meetsThreshold,
                    minGestureThreshold = stepThreshold
                )
            }
        }

        publishCaptureProgress(activeSamples.size)
        if (captureWindow.isComplete) {
            if (activeSamples.size >= CALIBRATION_MIN_VALID_SAMPLES) completeActiveStep() else retryCurrentStep()
        }
    }

    private fun completeActiveStep() {
        // Guard against multiple calls
        if (_uiState.value.stepCompleted) return
        
        val step = _uiState.value.currentStep
        val p95Value = CalibrationUtils.calculateP95(activeSamples)
        Log.d(TAG, "completeActiveStep: step=$step, p95=$p95Value, samples=${activeSamples.size}")
        
        step.gestureKey?.let { key ->
            currentBaseline = currentBaseline.withGestureMax(key, p95Value)
            calibratedGestureKeys += key
        }
        
        _uiState.update { 
            it.copy(
                currentBaseline = currentBaseline,
                stepCompleted = true
            ) 
        }
        
        // Trigger completion feedback
        triggerStepCompletionFeedback()
        
        // Auto-advance to next step after a short delay
        viewModelScope.launch {
            kotlinx.coroutines.delay(500)
            Log.d(TAG, "After delay, calling advanceToNextStep from step=$step")
            advanceToNextStep()
        }
    }

    private fun advanceToNextStep() {
        val current = _uiState.value.currentStep
        Log.d(TAG, "advanceToNextStep: current=$current")
        
        val currentIndex = requiredSteps.indexOf(current)
        val next = if (currentIndex != -1 && currentIndex + 1 < requiredSteps.size) {
            requiredSteps[currentIndex + 1]
        } else {
            CalibrationStep.Complete
        }
        
        Log.d(TAG, "advanceToNextStep: next=$next")
        
        if (next == CalibrationStep.Complete) {
            Log.d(TAG, "Finishing calibration")
            finishCalibration()
        } else {
            Log.d(TAG, "Starting active capture for $next")
            startActiveCapture(next)
        }
    }

    private fun triggerStepCompletionFeedback() {
        _uiState.update { it.copy(shouldPlayCompletionSound = true, shouldVibrate = true) }
    }

    fun onFeedbackConsumed() {
        _uiState.update { it.copy(shouldPlayCompletionSound = false, shouldVibrate = false) }
    }

    private fun finishCalibration() {
        _uiState.update { 
            it.copy(
                phase = CalibrationPhase.COMPLETE,
                currentStep = CalibrationStep.Complete,
                captureProgress = 1f
            ) 
        }
        if (calibratedGestureKeys.isEmpty()) {
            Log.w(TAG, "No gesture was calibrated, keeping the saved baseline")
            return
        }
        val capturedBaseline = currentBaseline.copy(capturedAtMillis = System.currentTimeMillis())
        viewModelScope.launch {
            calibrationRepository.saveBaseline(capturedBaseline)
        }
    }

    private companion object {
        const val TAG = "CalibrationVM"

        /** RF-053: neutral (tare), smile, surprise, kiss and jaw opening. */
        val DOCUMENTED_WIZARD = listOf(
            CalibrationStep.Neutral,
            CalibrationStep.Smile,
            CalibrationStep.Surprise,
            CalibrationStep.Kiss,
            CalibrationStep.JawOpen
        )

        /**
         * The eye strategies score blendshapes that none of the documented steps exercises, so a
         * routine with eye modules adds the step that measures what its strategy scores.
         */
        fun wizardStepsFor(modules: Set<MobileModule>): List<CalibrationStep> =
            DOCUMENTED_WIZARD +
                listOfNotNull(
                    CalibrationStep.EyesClosed.takeIf { MobileModule.EYES in modules },
                    CalibrationStep.EyesWide.takeIf { MobileModule.EYES_INVERSE in modules }
                ) +
                CalibrationStep.Complete
    }
}

data class CalibrationUiState(
    val phase: CalibrationPhase = CalibrationPhase.POSITIONING,
    val currentStep: CalibrationStep = CalibrationStep.Neutral,
    val captureProgress: Float = 0f,
    val globalProgress: Float = 0f, // New field for global progression through required steps
    val framesCaptured: Int = 0,
    val isCapturing: Boolean = false,
    val isRetryingStep: Boolean = false,
    val currentStepNumber: Int = 0,
    val totalSteps: Int = 0,
    val isHeadStable: Boolean = true,
    val isHeadRotated: Boolean = false,
    val isFaceDetected: Boolean = false,
    val isFaceInPosition: Boolean = false,
    val stepCompleted: Boolean = false,
    val currentBaseline: CalibrationBaseline = CalibrationBaseline(),
    val currentRawValue: Float = 0f,
    val currentCorrectedValue: Float = 0f,
    val shouldPlayCompletionSound: Boolean = false,
    val shouldVibrate: Boolean = false,
    val screenWidth: Int = 1080,
    val screenHeight: Int = 1920,
    // Distance validation
    val distanceState: DistanceState = DistanceState.TOO_FAR,
    val distanceOkProgress: Float = 0f,
    val isReadyToStart: Boolean = false,
    // Gesture intensity validation
    val minGestureThreshold: Float = CALIBRATION_THRESHOLD_DEFAULT,
    val isGestureIntensitySufficient: Boolean = false,
    // Debug info
    val debugFaceAreaRatio: Float = 0f,
    val debugFaceBox: String = "",
    val visionPerformance: VisionPerformanceSnapshot? = null
)

enum class CalibrationPhase {
    POSITIONING,
    NEUTRAL_CAPTURE,
    ACTIVE_CAPTURE,
    COMPLETE
}

enum class CalibrationStep(val gestureKey: String? = null) {
    Neutral,
    Smile(CalibrationBaseline.KEY_SMILE),
    Surprise(CalibrationBaseline.KEY_BROW_RAISE),
    Kiss(CalibrationBaseline.KEY_KISS),
    JawOpen(CalibrationBaseline.KEY_JAW_OPEN),
    EyesClosed(CalibrationBaseline.KEY_EYES_CLOSED),
    EyesWide(CalibrationBaseline.KEY_EYES_WIDE),
    Complete
}

/** Must stay aligned with the formulas in ExerciseStrategies so calibration and scoring measure the same signal. */
private val gestureReadings: Map<String, ((String) -> Float) -> Float> = mapOf(
    CalibrationBaseline.KEY_JAW_OPEN to { score -> score("jawOpen") },
    CalibrationBaseline.KEY_SMILE to { score -> (score("mouthSmileLeft") + score("mouthSmileRight")) / 2 },
    CalibrationBaseline.KEY_BROW_RAISE to { score ->
        (score("browInnerUp") + score("browOuterUpLeft") + score("browOuterUpRight")) / 3
    },
    CalibrationBaseline.KEY_KISS to { score -> score("mouthPucker") },
    CalibrationBaseline.KEY_EYES_CLOSED to { score -> (score("eyeBlinkLeft") + score("eyeBlinkRight")) / 2 },
    CalibrationBaseline.KEY_EYES_WIDE to { score -> (score("eyeWideLeft") + score("eyeWideRight")) / 2 }
)
