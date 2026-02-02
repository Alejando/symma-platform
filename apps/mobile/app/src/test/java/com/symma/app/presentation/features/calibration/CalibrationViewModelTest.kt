package com.symma.app.presentation.features.calibration

import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.symma.app.domain.model.CalibrationBaseline
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
    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = CalibrationViewModel()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is Instructions`() {
        assertEquals(CalibrationStep.Instructions, viewModel.uiState.value.currentStep)
    }

    @Test
    fun `nextStep transitions to Neutral`() {
        viewModel.nextStep()
        assertEquals(CalibrationStep.Neutral, viewModel.uiState.value.currentStep)
    }

    @Test
    fun `startCapture enables capturing`() = runTest {
        viewModel.nextStep() // To Neutral
        assertTrue(viewModel.uiState.value.isCapturing)
    }

    // Add more tests for next steps and logic flow
    @Test
    fun `full flow transitions`() = runTest {
        viewModel.nextStep()
        assertEquals(CalibrationStep.Neutral, viewModel.uiState.value.currentStep)
        
        viewModel.nextStep()
        assertEquals(CalibrationStep.Smile, viewModel.uiState.value.currentStep)
        
        viewModel.nextStep()
        assertEquals(CalibrationStep.BrowRaise, viewModel.uiState.value.currentStep)
        
        viewModel.nextStep()
        assertEquals(CalibrationStep.Kiss, viewModel.uiState.value.currentStep)
        
        viewModel.nextStep()
        assertEquals(CalibrationStep.JawOpen, viewModel.uiState.value.currentStep)
        
        viewModel.nextStep()
        assertEquals(CalibrationStep.Complete, viewModel.uiState.value.currentStep)
    }
}
