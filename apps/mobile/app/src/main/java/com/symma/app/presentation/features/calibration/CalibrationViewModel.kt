package com.symma.app.presentation.features.calibration

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.google.mediapipe.tasks.components.containers.Category
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.math.max

@HiltViewModel
class CalibrationViewModel @Inject constructor(
    private val calibrationRepository: CalibrationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CalibrationUiState())
    val uiState: StateFlow<CalibrationUiState> = _uiState.asStateFlow()

    private var isCapturing = false
    private var currentStepStartTimestamp: Long = 0

    // Temporary storage for max values during calibration
    private var currentBaseline = CalibrationBaseline()

    fun startCalibration() {
        _uiState.update { it.copy(currentStep = CalibrationStep.Instructions) }
    }
    
    fun nextStep() {
        val current = _uiState.value.currentStep
        val next = when (current) {
            CalibrationStep.Instructions -> CalibrationStep.Neutral
            CalibrationStep.Neutral -> CalibrationStep.Smile
            CalibrationStep.Smile -> CalibrationStep.BrowRaise
            CalibrationStep.BrowRaise -> CalibrationStep.Kiss
            CalibrationStep.Kiss -> CalibrationStep.JawOpen
            CalibrationStep.JawOpen -> CalibrationStep.Complete
            CalibrationStep.Complete -> CalibrationStep.Complete
        }
        
        if (next == CalibrationStep.Complete) {
            finishCalibration()
        } else {
             startCapture(next)
        }
    }

    private fun startCapture(step: CalibrationStep) {
        _uiState.update { it.copy(currentStep = step, isCapturing = true) }
        isCapturing = true
        currentStepStartTimestamp = System.currentTimeMillis()
        
        // Auto-advance logic after 3 seconds
        viewModelScope.launch {
            delay(3000)
            isCapturing = false
            _uiState.update { it.copy(isCapturing = false) }
            
            // Wait a moment before moving to next step automatically or let user click?
            // Requirement says "Auto-advance after 3 seconds of capture"
            nextStep()
        }
    }

    fun processFrame(result: FaceLandmarkerResult) {
        if (!isCapturing) return

        val blendshapesOptional = result.faceBlendshapes()
        if (!blendshapesOptional.isPresent) return
        
        val categories = blendshapesOptional.get().firstOrNull() ?: return
        
        // Helper to get score by category name
        fun getScore(name: String): Float {
             return categories.find { it.categoryName() == name }?.score() ?: 0f
        }

        val step = _uiState.value.currentStep

        when (step) {
            CalibrationStep.Smile -> {
                val smileScore = (getScore("mouthSmileLeft") + getScore("mouthSmileRight")) / 2
                currentBaseline = currentBaseline.copy(
                    mouthSmileMax = max(currentBaseline.mouthSmileMax, smileScore)
                )
            }
            CalibrationStep.BrowRaise -> {
                 val browScore = (getScore("browOuterUpLeft") + getScore("browOuterUpRight")) / 2
                 currentBaseline = currentBaseline.copy(
                     browRaiseMax = max(currentBaseline.browRaiseMax, browScore)
                 )
            }
            CalibrationStep.Kiss -> {
                 // "Mouth Pucker" is often used for kiss/duck face
                 val puckerScore = getScore("mouthPucker")
                 currentBaseline = currentBaseline.copy(
                     duckFaceMax = max(currentBaseline.duckFaceMax, puckerScore)
                 )
            }
             CalibrationStep.JawOpen -> {
                 val jawScore = getScore("jawOpen")
                  currentBaseline = currentBaseline.copy(
                     mouthOpenMax = max(currentBaseline.mouthOpenMax, jawScore)
                 )
            }
            // For Eyes Closed, we might want to capture during a specific step or just generally avoid blink noise?
            // Requirement said "eyesClosedMax". Let's assume we capture it if we have a step for it, 
            // but the RFC list in prompt was Neutral -> Smile -> Brows -> Kiss -> Jaw.
            // Maybe capture eyes closed during "Neutral" if they blink? Or add a specific step?
            // The prompt says "eyesClosedMax" in Data Model but steps didn't explicitly list "Close Eyes".
            // I will add a "CloseEyes" step to be safe or just capture min/max blendshapes if relevant.
            // For now, adhering strictly to the prompt's steps: Neutral -> Smile -> Brows -> Kiss -> Jaw.
            // I will leave eyesClosed logic for now or infer it.
            // Actually, let's stick to the prompt's listed steps for logic. 
            // If eyesClosed is required in baseline, it might be missed if not in steps.
            // I'll add a step for it to be complete or just leave it default.
            // Re-reading tasks: "Fields: ... eyesClosedMax". "Steps: Neutral -> Smile -> Brows -> Kiss -> Jaw".
            // Okay, I will stick to the listed steps.
            else -> {}
        }
        
         _uiState.update { it.copy(currentBaseline = currentBaseline) }
    }

    private fun finishCalibration() {
        _uiState.update { it.copy(currentStep = CalibrationStep.Complete, isCapturing = false) }
        viewModelScope.launch {
            calibrationRepository.saveBaseline(currentBaseline)
        }
    }
}

data class CalibrationUiState(
    val currentStep: CalibrationStep = CalibrationStep.Instructions,
    val isCapturing: Boolean = false,
    val currentBaseline: CalibrationBaseline = CalibrationBaseline()
)

enum class CalibrationStep {
    Instructions,
    Neutral,
    Smile,
    BrowRaise,
    Kiss,
    JawOpen,
    Complete
}
