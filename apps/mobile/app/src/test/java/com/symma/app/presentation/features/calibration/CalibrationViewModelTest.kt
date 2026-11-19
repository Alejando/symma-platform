package com.symma.app.presentation.features.calibration

import android.graphics.RectF
import androidx.lifecycle.SavedStateHandle
import com.google.mediapipe.tasks.components.containers.Category
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import com.symma.app.MainDispatcherRule
import com.symma.app.domain.logic.CALIBRATION_MIN_VALID_SAMPLES
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_BROW_RAISE
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_DEFAULT
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_EYES_CLOSED
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_JAW_OPEN
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_KISS
import com.symma.app.domain.logic.CALIBRATION_THRESHOLD_SMILE
import com.symma.app.domain.logic.CalibrationUtils
import com.symma.app.domain.logic.HeadRotationMatrices
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.Exercise
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
import com.symma.app.domain.repository.CalibrationRepository
import com.symma.app.domain.repository.RoutineRepository
import com.symma.app.presentation.components.camera.FaceLandmarkerHelper
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowSystemClock
import java.time.Duration
import java.util.Optional

@OptIn(ExperimentalCoroutinesApi::class)
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class CalibrationViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    private lateinit var viewModel: CalibrationViewModel
    private lateinit var calibrationRepository: CalibrationRepository
    private lateinit var routineRepository: RoutineRepository

    @Before
    fun setUp() {
        calibrationRepository = mockk(relaxed = true)
        every { calibrationRepository.getBaseline() } returns null
        routineRepository = mockk()
        every { routineRepository.getRoutineFlow() } returns flowOf(null)
        viewModel = createViewModel()
    }

    private fun createViewModel(routineId: String? = null): CalibrationViewModel {
        val savedStateHandle = SavedStateHandle(mapOf("routineId" to routineId))
        return CalibrationViewModel(calibrationRepository, routineRepository, savedStateHandle)
    }

    private fun holdFaceInPositionAndStart(target: CalibrationViewModel = viewModel) {
        target.onFaceDetected(true, centeredFaceBox(), IMAGE_SIZE, IMAGE_SIZE)
        ShadowSystemClock.advanceBy(Duration.ofMillis(1_100))
        target.onFaceDetected(true, centeredFaceBox(), IMAGE_SIZE, IMAGE_SIZE)
        target.startCalibration()
    }

    private fun feed(frame: FaceLandmarkerResult, times: Int, target: CalibrationViewModel = viewModel) {
        repeat(times) { target.processFrame(frame, IMAGE_SIZE, IMAGE_SIZE) }
    }

    private fun completeNeutralCapture(target: CalibrationViewModel = viewModel, resting: FaceLandmarkerResult = restingFace()) {
        feed(resting, NEUTRAL_FRAMES, target)
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
        assertEquals(0.25f, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `setGestureThreshold clamps below minimum to 0_05`() {
        viewModel.setGestureThreshold(0.0f)
        assertEquals(0.05f, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `setGestureThreshold clamps above maximum to 0_5`() {
        viewModel.setGestureThreshold(1.0f)
        assertEquals(0.5f, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `initial minGestureThreshold in UI state matches default constant`() {
        assertEquals(CALIBRATION_THRESHOLD_DEFAULT, viewModel.uiState.value.minGestureThreshold, 0.001f)
    }

    @Test
    fun `low-amplitude thresholds are below high-amplitude thresholds`() {
        assertTrue(CALIBRATION_THRESHOLD_BROW_RAISE < CALIBRATION_THRESHOLD_SMILE)
        assertTrue(CALIBRATION_THRESHOLD_EYES_CLOSED < CALIBRATION_THRESHOLD_JAW_OPEN)
        assertTrue(CALIBRATION_THRESHOLD_KISS > CALIBRATION_THRESHOLD_DEFAULT)
        assertTrue(CALIBRATION_MIN_VALID_SAMPLES > 0)
    }

    // ==================== Positioning ====================

    @Test
    fun `startCalibration is ignored until the face is held in position for one second`() {
        viewModel.onFaceDetected(true, centeredFaceBox(), IMAGE_SIZE, IMAGE_SIZE)
        viewModel.startCalibration()

        assertFalse(viewModel.uiState.value.isReadyToStart)
        assertEquals(CalibrationPhase.POSITIONING, viewModel.uiState.value.phase)

        ShadowSystemClock.advanceBy(Duration.ofMillis(1_100))
        viewModel.onFaceDetected(true, centeredFaceBox(), IMAGE_SIZE, IMAGE_SIZE)
        viewModel.startCalibration()

        assertEquals(CalibrationPhase.NEUTRAL_CAPTURE, viewModel.uiState.value.phase)
    }

    // ==================== processFrame ====================

    @Test
    fun `processFrame ignores frames while positioning`() {
        feed(gestureFrame("mouthSmileLeft" to 0.9f, "mouthSmileRight" to 0.9f), 10)

        val state = viewModel.uiState.value
        assertEquals(CalibrationPhase.POSITIONING, state.phase)
        assertEquals(0, state.framesCaptured)
    }

    @Test
    fun `processFrame without blendshapes does not capture samples`() {
        holdFaceInPositionAndStart()
        val frameWithoutBlendshapes = mockk<FaceLandmarkerResult> {
            every { faceBlendshapes() } returns Optional.empty()
            every { faceLandmarks() } returns listOf(centeredFaceLandmarks())
            every { facialTransformationMatrixes() } returns Optional.empty()
        }

        feed(frameWithoutBlendshapes, 10)

        assertEquals(0, viewModel.uiState.value.framesCaptured)
    }

    @Test
    fun `neutral capture stores the average resting value of each blendshape as tare`() {
        holdFaceInPositionAndStart()

        repeat(NEUTRAL_FRAMES / 2) {
            viewModel.processFrame(restingFace(smile = 0.08f, jawOpen = 0.04f), IMAGE_SIZE, IMAGE_SIZE)
            viewModel.processFrame(restingFace(smile = 0.12f, jawOpen = 0.06f), IMAGE_SIZE, IMAGE_SIZE)
        }

        val state = viewModel.uiState.value
        val baseline = state.currentBaseline
        assertEquals(0.10f, baseline.getNeutralOffset(CalibrationBaseline.KEY_SMILE), 0.0001f)
        assertEquals(0.05f, baseline.getNeutralOffset(CalibrationBaseline.KEY_JAW_OPEN), 0.0001f)
        assertEquals(CalibrationPhase.ACTIVE_CAPTURE, state.phase)
        assertEquals(CalibrationStep.Smile, state.currentStep)
    }

    @Test
    fun `active capture subtracts the neutral tare before storing the gesture max`() {
        holdFaceInPositionAndStart()
        completeNeutralCapture(resting = restingFace(smile = 0.10f))

        feed(smileFrame(0.70f), ACTIVE_FRAMES)

        val state = viewModel.uiState.value
        assertTrue(state.stepCompleted)
        assertEquals(0.60f, state.currentBaseline.mouthSmileMax, 0.0001f)
    }

    @Test
    fun `active capture keeps the P95 so isolated spikes are discarded`() {
        holdFaceInPositionAndStart()
        completeNeutralCapture(resting = restingFace(smile = 0.10f))

        feed(smileFrame(0.70f), ACTIVE_FRAMES - 1)
        feed(smileFrame(1.00f), 1)

        assertEquals(0.60f, viewModel.uiState.value.currentBaseline.mouthSmileMax, 0.0001f)
    }

    @Test
    fun `frames below the step threshold do not count toward the step`() {
        holdFaceInPositionAndStart()
        completeNeutralCapture(resting = restingFace(smile = 0.10f))

        feed(smileFrame(0.10f + CALIBRATION_THRESHOLD_SMILE - 0.05f), ACTIVE_FRAMES)

        val state = viewModel.uiState.value
        assertEquals(0, state.framesCaptured)
        assertFalse(state.isGestureIntensitySufficient)
        assertFalse(state.stepCompleted)
    }

    // ==================== Threading ====================

    @Test
    fun `landmarker results from the MediaPipe thread are applied on the main dispatcher`() {
        holdFaceInPositionAndStart()
        val bundle = FaceLandmarkerHelper.ResultBundle(restingFace(), 10, IMAGE_SIZE, IMAGE_SIZE)

        val mediaPipeThread = Thread { viewModel.onLandmarkerResult(bundle) }
        mediaPipeThread.start()
        mediaPipeThread.join()

        assertEquals(0, viewModel.uiState.value.framesCaptured)

        testDispatcher.scheduler.runCurrent()

        assertEquals(1, viewModel.uiState.value.framesCaptured)
    }

    // ==================== Head rotation guard ====================

    @Test
    fun `head rotation above ten degrees pauses capture and resumes when facing the camera again`() {
        holdFaceInPositionAndStart()
        feed(restingFace(headYawDegrees = 0f), 10)

        feed(restingFace(headYawDegrees = 15f), 20)

        val paused = viewModel.uiState.value
        assertEquals(10, paused.framesCaptured)
        assertTrue(paused.isHeadRotated)
        assertFalse(paused.isHeadStable)

        feed(restingFace(headYawDegrees = 3f), 5)

        val resumed = viewModel.uiState.value
        assertEquals(15, resumed.framesCaptured)
        assertFalse(resumed.isHeadRotated)
    }

    @Test
    fun `head pitch above ten degrees pauses gesture capture`() {
        holdFaceInPositionAndStart()
        completeNeutralCapture(resting = restingFace(smile = 0.10f))

        feed(smileFrame(0.70f, headPitchDegrees = -11f), ACTIVE_FRAMES)

        val state = viewModel.uiState.value
        assertEquals(0, state.framesCaptured)
        assertTrue(state.isHeadRotated)
        assertFalse(state.stepCompleted)
    }

    @Test
    fun `a constant tilt from a low camera is not treated as rotation`() {
        holdFaceInPositionAndStart()

        feed(restingFace(headPitchDegrees = 25f), NEUTRAL_FRAMES)

        assertEquals(CalibrationPhase.ACTIVE_CAPTURE, viewModel.uiState.value.phase)
    }

    // ==================== Dynamic sequence and saved baseline ====================

    @Test
    fun `calibrating a partial routine keeps the saved values of modules outside the routine`() = runTest(testDispatcher) {
        val saved = CalibrationBaseline(
            browRaiseMax = 0.33f,
            mouthSmileMax = 0.44f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_BROW_RAISE to 0.07f, CalibrationBaseline.KEY_SMILE to 0.02f)
        )
        every { calibrationRepository.getBaseline() } returns saved
        every { routineRepository.getRoutineFlow() } returns flowOf(routineWith("SMILE"))
        val partial = createViewModel(routineId = ROUTINE_ID)
        advanceUntilIdle()

        holdFaceInPositionAndStart(partial)
        completeNeutralCapture(partial, restingFace(smile = 0.10f))
        feed(smileFrame(0.70f), ACTIVE_FRAMES, partial)
        advanceUntilIdle()

        val savedBaseline = slot<CalibrationBaseline>()
        coVerify(exactly = 1) { calibrationRepository.saveBaseline(capture(savedBaseline)) }
        assertEquals(0.60f, savedBaseline.captured.mouthSmileMax, 0.0001f)
        assertEquals(0.10f, savedBaseline.captured.getNeutralOffset(CalibrationBaseline.KEY_SMILE), 0.0001f)
        assertEquals(0.33f, savedBaseline.captured.browRaiseMax, 0.0001f)
        assertEquals(0.07f, savedBaseline.captured.getNeutralOffset(CalibrationBaseline.KEY_BROW_RAISE), 0.0001f)
        assertEquals(CalibrationPhase.COMPLETE, partial.uiState.value.phase)
    }

    @Test
    fun `missing routine falls back to the full sequence instead of saving defaults`() = runTest(testDispatcher) {
        every { routineRepository.getRoutineFlow() } returns flowOf(null)
        val withoutRoutine = createViewModel(routineId = ROUTINE_ID)
        advanceUntilIdle()

        holdFaceInPositionAndStart(withoutRoutine)
        completeNeutralCapture(withoutRoutine)
        advanceUntilIdle()

        assertEquals(CalibrationPhase.ACTIVE_CAPTURE, withoutRoutine.uiState.value.phase)
        assertEquals(CalibrationStep.Smile, withoutRoutine.uiState.value.currentStep)
        coVerify(exactly = 0) { calibrationRepository.saveBaseline(any()) }
    }

    @Test
    fun `routine without calibratable modules falls back to the full sequence`() = runTest(testDispatcher) {
        every { routineRepository.getRoutineFlow() } returns flowOf(routineWith("UNKNOWN_MODULE"))
        val unknownModules = createViewModel(routineId = ROUTINE_ID)
        advanceUntilIdle()

        holdFaceInPositionAndStart(unknownModules)
        completeNeutralCapture(unknownModules)
        advanceUntilIdle()

        assertEquals(CalibrationStep.Smile, unknownModules.uiState.value.currentStep)
        coVerify(exactly = 0) { calibrationRepository.saveBaseline(any()) }
    }

    @Test
    fun `EYES_INVERSE routine calibrates the eyes wide gesture its strategy scores`() = runTest(testDispatcher) {
        every { routineRepository.getRoutineFlow() } returns flowOf(routineWith("EYES_INVERSE"))
        val eyesInverse = createViewModel(routineId = ROUTINE_ID)
        advanceUntilIdle()

        holdFaceInPositionAndStart(eyesInverse)
        completeNeutralCapture(eyesInverse, gestureFrame("eyeWideLeft" to 0.05f, "eyeWideRight" to 0.05f))
        assertEquals(CalibrationStep.EyesWide, eyesInverse.uiState.value.currentStep)

        feed(gestureFrame("eyeWideLeft" to 0.45f, "eyeWideRight" to 0.45f), ACTIVE_FRAMES, eyesInverse)
        advanceUntilIdle()

        val savedBaseline = slot<CalibrationBaseline>()
        coVerify { calibrationRepository.saveBaseline(capture(savedBaseline)) }
        assertEquals(0.40f, savedBaseline.captured.eyesWideMax, 0.0001f)
        assertEquals(0.05f, savedBaseline.captured.getNeutralOffset(CalibrationBaseline.KEY_EYES_WIDE), 0.0001f)
    }

    // ==================== CalibrationUtils P95 ====================

    @Test
    fun `calculateP95 discards the top five percent of samples`() {
        val samples = (1..100).map { it / 100f }

        assertEquals(0.96f, CalibrationUtils.calculateP95(samples), 0.0001f)
    }

    @Test
    fun `calculateP95 of an empty list is zero`() {
        assertEquals(0f, CalibrationUtils.calculateP95(emptyList()), 0f)
    }

    // ==================== Fixtures ====================

    private fun routineWith(vararg mobileModules: String) = Routine(
        id = ROUTINE_ID,
        name = "Routine",
        startDate = "2026-01-01",
        endDate = null,
        status = "ACTIVE",
        items = mobileModules.mapIndexed { index, module ->
            RoutineItem(
                id = "item-$index",
                orderIndex = index,
                targetRepetitions = 1,
                targetSets = 1,
                holdTimeSeconds = 0,
                restBetweenSetsSeconds = 0,
                exercise = Exercise("ex-$index", module, "unmapped_key", null, "ISOTONIC", "CORE", module, null, null)
            )
        }
    )

    private fun centeredFaceBox() = RectF(250f, 250f, 750f, 650f)

    private fun centeredFaceLandmarks(): List<NormalizedLandmark> = listOf(
        NormalizedLandmark.create(0.25f, 0.25f, 0f),
        NormalizedLandmark.create(0.75f, 0.65f, 0f)
    )

    private fun restingFace(
        smile: Float = 0.10f,
        jawOpen: Float = 0.05f,
        headYawDegrees: Float = 0f,
        headPitchDegrees: Float = 0f
    ): FaceLandmarkerResult = gestureFrame(
        "mouthSmileLeft" to smile,
        "mouthSmileRight" to smile,
        "jawOpen" to jawOpen,
        headPose = HeadRotationMatrices.rotation(headYawDegrees, headPitchDegrees)
    )

    private fun smileFrame(smile: Float, headPitchDegrees: Float = 0f) = gestureFrame(
        "mouthSmileLeft" to smile,
        "mouthSmileRight" to smile,
        headPose = HeadRotationMatrices.rotation(pitchDegrees = headPitchDegrees)
    )

    private fun gestureFrame(
        vararg blendshapes: Pair<String, Float>,
        headPose: FloatArray = HeadRotationMatrices.rotation()
    ): FaceLandmarkerResult {
        val categories = blendshapes.map { (name, score) -> Category.create(score, 0, name, name) }
        return mockk {
            every { faceBlendshapes() } returns Optional.of(listOf(categories))
            every { faceLandmarks() } returns listOf(centeredFaceLandmarks())
            every { facialTransformationMatrixes() } returns Optional.of(listOf(headPose))
        }
    }

    private companion object {
        const val ROUTINE_ID = "routine-1"
        const val IMAGE_SIZE = 1000
        const val NEUTRAL_FRAMES = 60
        const val ACTIVE_FRAMES = 90
    }
}
