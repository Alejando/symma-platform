package com.symma.app.presentation.features.calibration

import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

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
