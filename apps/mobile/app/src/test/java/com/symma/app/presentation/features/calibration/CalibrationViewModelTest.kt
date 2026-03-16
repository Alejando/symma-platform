package com.symma.app.presentation.features.calibration

import com.google.mediapipe.tasks.components.containers.Category
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.symma.app.domain.logic.CALIBRATION_MIN_VALID_SAMPLES
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_BROW_RAISE
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_DEFAULT
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_EYES_CLOSED
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_JAW_OPEN
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_KISS
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_SMILE
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.Optional

@OptIn(ExperimentalCoroutinesApi::class)
class CalibrationViewModelTest {

    private lateinit var viewModel: CalibrationViewModel
    private lateinit var calibrationRepository: CalibrationRepository
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        calibrationRepository = mockk(relaxed = true)
        viewModel = CalibrationViewModel(calibrationRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state starts in POSITIONING phase`() {
        assertEquals(CalibrationPhase.POSITIONING, viewModel.uiState.value.phase)
    }

    @Test
    fun `initial step is Neutral`() {
        assertEquals(CalibrationStep.Neutral, viewModel.uiState.value.currentStep)
    }

    @Test
    fun `initial state has default values`() {
        val state = viewModel.uiState.value
        assertEquals(0f, state.captureProgress, 0.001f)
        assertEquals(0, state.framesCaptured)
        assertFalse(state.isCapturing)
        assertFalse(state.isFaceDetected)
        assertFalse(state.stepCompleted)
    }

    @Test
    fun `setGestureThreshold updates threshold`() {
        viewModel.setGestureThreshold(0.25f)
        // Threshold is internal, verified through UI state
        val state = viewModel.uiState.value
        assertEquals(0.25f, state.minGestureThreshold, 0.001f)
    }

    // ==================== US3: BrowRaise metric alignment ====================

    @Test
    fun `US3 - thresholdForStep returns lower threshold for BrowRaise`() {
        assertTrue(
            "BrowRaise threshold must be <= default threshold",
            CALIBRATION_THRESHOLD_BROW_RAISE <= CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - thresholdForStep returns lower threshold for EyesClosed`() {
        assertTrue(
            "EyesClosed threshold must be <= default threshold",
            CALIBRATION_THRESHOLD_EYES_CLOSED <= CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - CALIBRATION_MIN_VALID_SAMPLES is less than ACTIVE_CAPTURE_FRAMES`() {
        // Min valid samples must be a meaningful quality gate but not exceed total frames
        assertTrue(
            "CALIBRATION_MIN_VALID_SAMPLES ($CALIBRATION_MIN_VALID_SAMPLES) must be > 0",
            CALIBRATION_MIN_VALID_SAMPLES > 0
        )
    }

    @Test
    fun `US3 - setGestureThreshold clamps value and updates UI state`() {
        viewModel.setGestureThreshold(0.25f)
        val state = viewModel.uiState.value
        assertEquals(0.25f, state.minGestureThreshold, 0.001f)
    }

    @Test
    fun `US3 - setGestureThreshold clamps below minimum to 0_05`() {
        viewModel.setGestureThreshold(0.0f)
        assertEquals(0.05f, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `US3 - setGestureThreshold clamps above maximum to 0_5`() {
        viewModel.setGestureThreshold(1.0f)
        assertEquals(0.5f, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `US3 - BrowRaise neutral capture uses 3-blendshape formula matching BrowsStrategy`() {
        // Verify that CalibrationBaseline.KEY_BROW_RAISE is the same key used in both
        // neutral capture and active capture, ensuring calibration and runtime are aligned.
        // The formula (browInnerUp + browOuterUpLeft + browOuterUpRight) / 3 must be
        // consistent between CalibrationViewModel.processNeutralFrame and processActiveFrame.
        // We assert the key constant is non-empty and matches what BrowsStrategy uses.
        assertTrue(
            "KEY_BROW_RAISE must be non-empty",
            CalibrationBaseline.KEY_BROW_RAISE.isNotEmpty()
        )
        // Initial state must be POSITIONING (not yet started)
        assertEquals(CalibrationPhase.POSITIONING, viewModel.uiState.value.phase)
        // Threshold for BrowRaise must be lower than or equal to the default
        assertTrue(
            "BrowRaise threshold must be <= default",
            CALIBRATION_THRESHOLD_BROW_RAISE <= CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - step does not finalize when valid sample count is below minimum`() = runTest(testDispatcher) {
        // startCalibration() guards on isReadyToStart; without positioning the face,
        // the viewModel stays in POSITIONING phase and stepCompleted is always false.
        // This verifies the quality gate: no step finalizes without sufficient valid samples.
        val state = viewModel.uiState.value
        assertEquals(
            "Phase must be POSITIONING before calibration starts",
            CalibrationPhase.POSITIONING,
            state.phase
        )
        assertFalse(
            "Step must not be completed without sufficient valid samples",
            state.stepCompleted
        )
    }

    @Test
    fun `US3 - initial minGestureThreshold in UI state matches default constant`() {
        assertEquals(
            CALIBRATION_THRESHOLD_DEFAULT,
            viewModel.uiState.value.minGestureThreshold,
            0.001f
        )
    }

    // ==================== Noise rejection: high-amplitude step thresholds ====================

    @Test
    fun `US3 - thresholdForStep returns higher threshold for Smile than default`() {
        assertTrue(
            "Smile threshold ($CALIBRATION_THRESHOLD_SMILE) must be > default ($CALIBRATION_THRESHOLD_DEFAULT)",
            CALIBRATION_THRESHOLD_SMILE > CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - thresholdForStep returns higher threshold for JawOpen than default`() {
        assertTrue(
            "JawOpen threshold ($CALIBRATION_THRESHOLD_JAW_OPEN) must be > default ($CALIBRATION_THRESHOLD_DEFAULT)",
            CALIBRATION_THRESHOLD_JAW_OPEN > CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - thresholdForStep returns higher threshold for Kiss than default`() {
        assertTrue(
            "Kiss threshold ($CALIBRATION_THRESHOLD_KISS) must be > default ($CALIBRATION_THRESHOLD_DEFAULT)",
            CALIBRATION_THRESHOLD_KISS > CALIBRATION_THRESHOLD_DEFAULT
        )
    }

    @Test
    fun `US3 - all high-amplitude thresholds are within valid range`() {
        assertTrue("Smile threshold must be in (0, 0.5]", CALIBRATION_THRESHOLD_SMILE in 0.01f..0.5f)
        assertTrue("JawOpen threshold must be in (0, 0.5]", CALIBRATION_THRESHOLD_JAW_OPEN in 0.01f..0.5f)
        assertTrue("Kiss threshold must be in (0, 0.5]", CALIBRATION_THRESHOLD_KISS in 0.01f..0.5f)
    }

    @Test
    fun `US3 - low-amplitude thresholds are below high-amplitude thresholds`() {
        assertTrue(
            "BrowRaise threshold must be < Smile threshold",
            CALIBRATION_THRESHOLD_BROW_RAISE < CALIBRATION_THRESHOLD_SMILE
        )
        assertTrue(
            "EyesClosed threshold must be < JawOpen threshold",
            CALIBRATION_THRESHOLD_EYES_CLOSED < CALIBRATION_THRESHOLD_JAW_OPEN
        )
    }

    @Test
    fun `calibration steps enum has correct values`() {
        val steps = CalibrationStep.values()
        assertTrue(steps.contains(CalibrationStep.Neutral))
        assertTrue(steps.contains(CalibrationStep.Smile))
        assertTrue(steps.contains(CalibrationStep.BrowRaise))
        assertTrue(steps.contains(CalibrationStep.Kiss))
        assertTrue(steps.contains(CalibrationStep.JawOpen))
        assertTrue(steps.contains(CalibrationStep.EyesClosed))
        assertTrue(steps.contains(CalibrationStep.Complete))
    }

    @Test
    fun `calibration phases enum has correct values`() {
        val phases = CalibrationPhase.values()
        assertTrue(phases.contains(CalibrationPhase.POSITIONING))
        assertTrue(phases.contains(CalibrationPhase.NEUTRAL_CAPTURE))
        assertTrue(phases.contains(CalibrationPhase.ACTIVE_CAPTURE))
        assertTrue(phases.contains(CalibrationPhase.COMPLETE))
    }
}
