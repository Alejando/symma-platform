package com.symma.app.presentation.features.calibration

import android.graphics.RectF
import android.util.Log
import android.util.Size
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.symma.app.domain.logic.CalibrationUtils
import com.symma.app.domain.logic.DistanceState
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val NEUTRAL_CAPTURE_FRAMES = 60
private const val ACTIVE_CAPTURE_FRAMES = 90
private const val MIN_VALID_SAMPLES = 45
private const val DISTANCE_OK_REQUIRED_MS = 1000L  // 1 second at correct distance required
private const val DEFAULT_MIN_GESTURE_THRESHOLD = 0.15f  // 15% minimum gesture intensity

@HiltViewModel
class CalibrationViewModel @Inject constructor(
    private val calibrationRepository: CalibrationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState.asStateFlow()

    private var currentBaseline = CalibrationBaseline()
    
    // Sample buffers for statistical analysis
    private val neutralSamples = mutableMapOf<String, MutableList<Float>>()
    private val activeSamples = mutableListOf<Float>()
    
    // Head stability tracking
    private var previousFaceBox: RectF? = null
    private var consecutiveStableFrames = 0
    private var validSampleCount = 0
    
    // Distance validation tracking
    private var distanceOkStartTime: Long? = null
    
    // Configurable gesture threshold (can be set per session)
    private var minGestureThreshold: Float = DEFAULT_MIN_GESTURE_THRESHOLD

    /**
     * Configure the minimum gesture threshold for this calibration session.
     * @param threshold Value between 0.0 and 1.0 (e.g., 0.15 = 15%)
     */
    fun setGestureThreshold(threshold: Float) {
        minGestureThreshold = threshold.coerceIn(0.05f, 0.5f)
        _uiState.update { it.copy(minGestureThreshold = minGestureThreshold) }
    }

    fun onFaceDetected(isDetected: Boolean, faceBox: RectF? = null, imageWidth: Int = 0, imageHeight: Int = 0) {
        val currentPhase = _uiState.value.phase
        if (currentPhase == CalibrationPhase.POSITIONING) {
            // Use image dimensions for ratio calculation (face box is in image coordinates)
            val effectiveWidth = if (imageWidth > 0) imageWidth else _uiState.value.screenWidth
            val effectiveHeight = if (imageHeight > 0) imageHeight else _uiState.value.screenHeight
            val imageSize = Size(effectiveWidth, effectiveHeight)
            
            // Check distance state using image coordinates
            val distanceState = CalibrationUtils.isDistanceCorrect(faceBox, imageSize)
            
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
            val now = System.currentTimeMillis()
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

    fun setScreenDimensions(width: Int, height: Int) {
        _uiState.update { it.copy(screenWidth = width, screenHeight = height) }
    }

    fun startCalibration() {
        if (!_uiState.value.isReadyToStart) return
        
        // Reset state and move to Neutral capture
        neutralSamples.clear()
        neutralSamples[CalibrationBaseline.KEY_JAW_OPEN] = mutableListOf()
        neutralSamples[CalibrationBaseline.KEY_SMILE] = mutableListOf()
        neutralSamples[CalibrationBaseline.KEY_BROW_RAISE] = mutableListOf()
        neutralSamples[CalibrationBaseline.KEY_KISS] = mutableListOf()
        neutralSamples[CalibrationBaseline.KEY_EYES_CLOSED] = mutableListOf()
        
        previousFaceBox = null
        consecutiveStableFrames = 0
        
        _uiState.update { 
            it.copy(
                phase = CalibrationPhase.NEUTRAL_CAPTURE,
                currentStep = CalibrationStep.Neutral,
                captureProgress = 0f,
                isHeadStable = true,
                framesCaptured = 0
            ) 
        }
    }

    fun processFrame(result: FaceLandmarkerResult, imageWidth: Int, imageHeight: Int) {
        val phase = _uiState.value.phase
        val step = _uiState.value.currentStep
        
        if (phase == CalibrationPhase.POSITIONING || phase == CalibrationPhase.COMPLETE) {
            return
        }

        val blendshapesOptional = result.faceBlendshapes()
        if (!blendshapesOptional.isPresent) {
            Log.d("CalibrationVM", "processFrame: no blendshapes for phase=$phase, step=$step")
            return
        }
        
        val categories = blendshapesOptional.get().firstOrNull() ?: return
        val landmarks = result.faceLandmarks().firstOrNull() ?: return
        
        // Get face bounding box for stability check
        val currentFaceBox = CalibrationUtils.getFaceBoundingBox(landmarks, imageWidth, imageHeight)
        
        // Check head stability
        val isStable = if (previousFaceBox != null && currentFaceBox != null) {
            CalibrationUtils.isHeadStable(currentFaceBox, previousFaceBox)
        } else {
            true
        }
        previousFaceBox = currentFaceBox
        
        _uiState.update { it.copy(isHeadStable = isStable) }

        // Helper to extract blendshape scores
        fun getScore(name: String): Float {
            return categories.find { it.categoryName() == name }?.score() ?: 0f
        }

        when (phase) {
            CalibrationPhase.NEUTRAL_CAPTURE -> processNeutralFrame(::getScore, isStable)
            CalibrationPhase.ACTIVE_CAPTURE -> {
                Log.d("CalibrationVM", "processFrame: ACTIVE_CAPTURE, step=$step, isStable=$isStable, validSamples=$validSampleCount")
                processActiveFrame(::getScore, isStable)
            }
            else -> {}
        }
    }

    private fun processNeutralFrame(getScore: (String) -> Float, isStable: Boolean) {
        if (!isStable) {
            consecutiveStableFrames = 0
            return
        }
        
        consecutiveStableFrames++
        
        // Collect neutral values for all blendshapes
        neutralSamples[CalibrationBaseline.KEY_JAW_OPEN]?.add(getScore("jawOpen"))
        neutralSamples[CalibrationBaseline.KEY_SMILE]?.add(
            (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2
        )
        neutralSamples[CalibrationBaseline.KEY_BROW_RAISE]?.add(
            (getScore("browOuterUpLeft") + getScore("browOuterUpRight")) / 2
        )
        neutralSamples[CalibrationBaseline.KEY_KISS]?.add(getScore("mouthPucker"))
        neutralSamples[CalibrationBaseline.KEY_EYES_CLOSED]?.add(
            (getScore("eyeBlinkLeft") + getScore("eyeBlinkRight")) / 2
        )
        
        val framesCaptured = neutralSamples[CalibrationBaseline.KEY_JAW_OPEN]?.size ?: 0
        val progress = framesCaptured.toFloat() / NEUTRAL_CAPTURE_FRAMES
        
        _uiState.update { 
            it.copy(
                captureProgress = progress.coerceAtMost(1f),
                framesCaptured = framesCaptured
            ) 
        }
        
        // Complete neutral phase
        if (framesCaptured >= NEUTRAL_CAPTURE_FRAMES) {
            completeNeutralPhase()
        }
    }

    private fun completeNeutralPhase() {
        // Calculate average neutral offsets
        val neutralOffsets = mutableMapOf<String, Float>()
        neutralSamples.forEach { (key, samples) ->
            neutralOffsets[key] = CalibrationUtils.calculateAverage(samples)
        }
        
        currentBaseline = currentBaseline.copy(neutralOffsets = neutralOffsets)
        
        // Update baseline in state BEFORE starting active capture
        _uiState.update { 
            it.copy(currentBaseline = currentBaseline) 
        }
        
        // Move to first active capture step (this sets stepCompleted = false)
        startActiveCapture(CalibrationStep.Smile)
    }

    private fun startActiveCapture(step: CalibrationStep) {
        Log.d("CalibrationVM", "startActiveCapture: step=$step, clearing samples")
        activeSamples.clear()
        validSampleCount = 0
        previousFaceBox = null
        
        _uiState.update { 
            it.copy(
                phase = CalibrationPhase.ACTIVE_CAPTURE,
                currentStep = step,
                captureProgress = 0f,
                isHeadStable = true,
                stepCompleted = false,
                framesCaptured = 0
            ) 
        }
        Log.d("CalibrationVM", "startActiveCapture: state updated for $step, stepCompleted=${_uiState.value.stepCompleted}")
    }

    private fun processActiveFrame(getScore: (String) -> Float, isStable: Boolean) {
        val step = _uiState.value.currentStep
        val stepCompleted = _uiState.value.stepCompleted
        
        // Skip if step is already completed (waiting for advance)
        if (stepCompleted) {
            Log.d("CalibrationVM", "processActiveFrame: skipping, stepCompleted=true for $step")
            return
        }
        
        // Only capture when head is stable
        if (!isStable) {
            _uiState.update { it.copy(isHeadStable = false) }
            return
        }
        
        // Extract raw value based on current step
        val rawValue = when (step) {
            CalibrationStep.Smile -> (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2
            CalibrationStep.BrowRaise -> (getScore("browOuterUpLeft") + getScore("browOuterUpRight")) / 2
            CalibrationStep.Kiss -> getScore("mouthPucker")
            CalibrationStep.JawOpen -> getScore("jawOpen")
            CalibrationStep.EyesClosed -> (getScore("eyeBlinkLeft") + getScore("eyeBlinkRight")) / 2
            else -> return
        }
        
        // Apply neutral offset (Tare)
        val neutralKey = when (step) {
            CalibrationStep.Smile -> CalibrationBaseline.KEY_SMILE
            CalibrationStep.BrowRaise -> CalibrationBaseline.KEY_BROW_RAISE
            CalibrationStep.Kiss -> CalibrationBaseline.KEY_KISS
            CalibrationStep.JawOpen -> CalibrationBaseline.KEY_JAW_OPEN
            CalibrationStep.EyesClosed -> CalibrationBaseline.KEY_EYES_CLOSED
            else -> return
        }
        val neutralOffset = currentBaseline.getNeutralOffset(neutralKey)
        val correctedValue = (rawValue - neutralOffset).coerceAtLeast(0f)
        
        // Check if gesture intensity meets minimum threshold
        val meetsThreshold = correctedValue >= minGestureThreshold
        
        if (meetsThreshold) {
            activeSamples.add(correctedValue)
            validSampleCount++
        }
        
        val progress = validSampleCount.toFloat() / ACTIVE_CAPTURE_FRAMES
        _uiState.update { 
            it.copy(
                captureProgress = progress.coerceAtMost(1f),
                framesCaptured = validSampleCount,
                currentRawValue = rawValue,
                currentCorrectedValue = correctedValue,
                isGestureIntensitySufficient = meetsThreshold
            ) 
        }
        
        // Complete active capture for this step
        if (validSampleCount >= ACTIVE_CAPTURE_FRAMES && !_uiState.value.stepCompleted) {
            completeActiveStep()
        }
    }

    private fun completeActiveStep() {
        // Guard against multiple calls
        if (_uiState.value.stepCompleted) return
        
        val step = _uiState.value.currentStep
        val p95Value = CalibrationUtils.calculateP95(activeSamples)
        Log.d("CalibrationVM", "completeActiveStep: step=$step, p95=$p95Value, samples=${activeSamples.size}")
        
        // Update baseline with P95 value
        currentBaseline = when (step) {
            CalibrationStep.Smile -> currentBaseline.copy(mouthSmileMax = p95Value)
            CalibrationStep.BrowRaise -> currentBaseline.copy(browRaiseMax = p95Value)
            CalibrationStep.Kiss -> currentBaseline.copy(duckFaceMax = p95Value)
            CalibrationStep.JawOpen -> currentBaseline.copy(mouthOpenMax = p95Value)
            CalibrationStep.EyesClosed -> currentBaseline.copy(eyesClosedMax = p95Value)
            else -> currentBaseline
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
            Log.d("CalibrationVM", "After delay, calling advanceToNextStep from step=$step")
            advanceToNextStep()
        }
    }

    private fun advanceToNextStep() {
        val current = _uiState.value.currentStep
        Log.d("CalibrationVM", "advanceToNextStep: current=$current")
        val next = when (current) {
            CalibrationStep.Neutral -> CalibrationStep.Smile
            CalibrationStep.Smile -> CalibrationStep.BrowRaise
            CalibrationStep.BrowRaise -> CalibrationStep.Kiss
            CalibrationStep.Kiss -> CalibrationStep.JawOpen
            CalibrationStep.JawOpen -> CalibrationStep.EyesClosed
            CalibrationStep.EyesClosed -> CalibrationStep.Complete
            else -> CalibrationStep.Complete
        }
        Log.d("CalibrationVM", "advanceToNextStep: next=$next")
        
        if (next == CalibrationStep.Complete) {
            Log.d("CalibrationVM", "Finishing calibration")
            finishCalibration()
        } else {
            Log.d("CalibrationVM", "Starting active capture for $next")
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
        viewModelScope.launch {
            calibrationRepository.saveBaseline(currentBaseline)
        }
    }
}

data class CalibrationUiState(
    val phase: CalibrationPhase = CalibrationPhase.POSITIONING,
    val currentStep: CalibrationStep = CalibrationStep.Neutral,
    val captureProgress: Float = 0f,
    val framesCaptured: Int = 0,
    val isCapturing: Boolean = false,
    val isHeadStable: Boolean = true,
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
    val minGestureThreshold: Float = DEFAULT_MIN_GESTURE_THRESHOLD,
    val isGestureIntensitySufficient: Boolean = false,
    // Debug info
    val debugFaceAreaRatio: Float = 0f,
    val debugFaceBox: String = ""
)

enum class CalibrationPhase {
    POSITIONING,
    NEUTRAL_CAPTURE,
    ACTIVE_CAPTURE,
    COMPLETE
}

enum class CalibrationStep {
    Neutral,
    Smile,
    BrowRaise,
    Kiss,
    JawOpen,
    EyesClosed,
    Complete
}
