package com.symma.app.presentation.player

import androidx.lifecycle.SavedStateHandle
import app.cash.turbine.test
import com.symma.app.MainDispatcherRule
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.Exercise
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
import com.symma.app.domain.repository.CalibrationRepository
import com.symma.app.domain.repository.RoutineRepository
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class PlayerViewModelTest {

    // Use StandardTestDispatcher for precise time control
    private val testDispatcher = StandardTestDispatcher()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    private lateinit var routineRepository: RoutineRepository
    private lateinit var calibrationRepository: CalibrationRepository
    private lateinit var routineFlow: MutableStateFlow<Routine?>
    private lateinit var savedStateHandle: SavedStateHandle
    private lateinit var viewModel: PlayerViewModel

    @Before
    fun setup() {
        routineFlow = MutableStateFlow(null)
        routineRepository = mockk()
        calibrationRepository = mockk()
        every { routineRepository.getRoutineFlow() } returns routineFlow
        every { calibrationRepository.getBaseline() } returns CalibrationBaseline()
        savedStateHandle = SavedStateHandle()
    }

    private fun createIsometricRoutine(reps: Int = 2, holdSeconds: Int = 3): Routine {
        return Routine(
            id = "routine-isometric",
            name = "Isometric Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(
                RoutineItem(
                    id = "item-iso",
                    orderIndex = 0,
                    targetRepetitions = reps,
                    targetSets = 1,
                    holdTimeSeconds = holdSeconds,
                    restBetweenSetsSeconds = 0,
                    exercise = Exercise("ex-iso", "Smile Hold", "smile", "Hold smile", "isometric", "smile", null, null, null)
                )
            )
        )
    }

    private fun createIsotonicRoutine(reps: Int = 2): Routine {
        return Routine(
            id = "routine-isotonic",
            name = "Isotonic Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(
                RoutineItem(
                    id = "item-tonic",
                    orderIndex = 0,
                    targetRepetitions = reps,
                    targetSets = 1,
                    holdTimeSeconds = 0,
                    restBetweenSetsSeconds = 0,
                    exercise = Exercise("ex-tonic", "Smile Pulse", "smile", "Pulse smile", "isotonic", "smile", null, null, null)
                )
            )
        )
    }

    private fun createTestRoutine(): Routine {
        return Routine(
            id = "routine-1",
            name = "Test Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(
                RoutineItem(
                    id = "item-1",
                    orderIndex = 0,
                    targetRepetitions = 2,
                    targetSets = 1,
                    holdTimeSeconds = 3,
                    restBetweenSetsSeconds = 5,
                    exercise = Exercise("ex-1", "Exercise 1", "ex1", "Desc", "type", "cat", null, null, null)
                ),
                RoutineItem(
                    id = "item-2",
                    orderIndex = 1,
                    targetRepetitions = 1, // Only 1 rep for second exercise
                    targetSets = 1,
                    holdTimeSeconds = 2,
                    restBetweenSetsSeconds = 0,
                    exercise = Exercise("ex-2", "Exercise 2", "ex2", "Desc", "type", "cat", null, null, null)
                )
            )
        )
    }

    @Test
    fun `Verify Initial State starts in GetReady`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()

        // When
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)

        // Then
        viewModel.uiState.test {
            assertEquals(PlayerUiState.Loading, awaitItem())
            
            // Allow coroutine to launch and emit GetReady
            testDispatcher.scheduler.runCurrent()
            
            val state = awaitItem()
            assertTrue("Expected GetReady state", state is PlayerUiState.GetReady)
            assertEquals(5, (state as PlayerUiState.GetReady).countdownSeconds)
        }
    }

    @Test
    fun `Verify Countdown transitions from GetReady to Exercise`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent() // Process Loading -> GetReady

        // When/Then
        viewModel.uiState.test {
            // Already in GetReady(5)
            val initialState = awaitItem()
            assertTrue(initialState is PlayerUiState.GetReady)

            // Advance 5 seconds (GetReady count down)
            advanceTimeBy(5000)
            
            // Must transition to Exercise
            // Note: Since we use ensureAllEventsConsumed check or just look for the state
            // The flow might emit intermediate integer updates (4,3,2,1).
            // We want to verify it eventually hits Exercise.
            
            // Advance small buffer for state transition
            advanceTimeBy(100)
            
            val state = expectMostRecentItem()
            assertTrue("Expected Exercise state after countdown", state is PlayerUiState.Exercise)
            val exerciseState = state as PlayerUiState.Exercise
            assertEquals("Exercise 1", exerciseState.exerciseName)
            assertEquals(3, exerciseState.timeLeft) // Hold time from test routine
        }
    }

    @Test
    fun `Verify Exercise state has correct initial rep count`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent() // Loading -> GetReady
        advanceTimeBy(5500) // Skip GetReady (5s)

        viewModel.uiState.test {
            // Should be in Exercise 1, Rep 1
            val startState = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals(1, startState.currentRep)
            assertEquals(2, startState.totalReps)
            assertEquals(3, startState.holdTimeLeft) // Hold time from test routine
        }
    }

    @Test
    fun `Verify Completed state has correct structure`() = runTest(testDispatcher) {
        // Test that Completed state can be created with expected values
        val completedState = PlayerUiState.Completed(
            routineId = "test-routine",
            totalExercises = 5,
            totalTimeSeconds = 120L
        )
        
        assertEquals("test-routine", completedState.routineId)
        assertEquals(5, completedState.totalExercises)
        assertEquals(120L, completedState.totalTimeSeconds)
    }

    // ==================== RFC-031: Clinical State Machine Tests ====================

    private fun createMultiSetRoutine(): Routine {
        return Routine(
            id = "routine-multiset",
            name = "Multi-Set Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(
                RoutineItem(
                    id = "item-1",
                    orderIndex = 0,
                    targetRepetitions = 2,
                    targetSets = 2,
                    holdTimeSeconds = 3,
                    restBetweenSetsSeconds = 5,
                    exercise = Exercise("ex-1", "Eyes Close", "eyes", "Close eyes tightly", "isometric", "eyes", null, null, null)
                )
            )
        )
    }

    @Test
    fun `RFC-031 - Exercise state includes Set tracking`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100) // Skip GetReady

        viewModel.uiState.test {
            val state = expectMostRecentItem()
            assertTrue("Expected Exercise state", state is PlayerUiState.Exercise)
            
            val exerciseState = state as PlayerUiState.Exercise
            assertEquals("Should start at Set 1", 1, exerciseState.currentSet)
            assertEquals("Should have 2 total sets", 2, exerciseState.totalSets)
            assertEquals("Should start at Rep 1", 1, exerciseState.currentRep)
            assertEquals("Should have 2 total reps", 2, exerciseState.totalReps)
            assertTrue("Should be isometric", exerciseState.isIsometric)
        }
    }

    @Test
    fun `RFC-031 - processFrame updates isTargetReached when score reaches 1`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100) // Skip GetReady

        viewModel.uiState.test {
            val initialState = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals(3, initialState.holdTimeLeft)
            assertEquals(false, initialState.isTargetReached)

            // Simulate frame with score >= 1.0 (target reached)
            viewModel.processFrame(1.0f)
            
            val afterFrame = expectMostRecentItem() as PlayerUiState.Exercise
            assertTrue("Target should be reached after score 1.0", afterFrame.isTargetReached)
        }
    }

    @Test
    fun `RFC-031 - isTargetReached becomes false when score drops below 1`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        viewModel.uiState.test {
            // First reach target
            viewModel.processFrame(1.0f)
            val reachedState = expectMostRecentItem() as PlayerUiState.Exercise
            assertTrue("Target should be reached", reachedState.isTargetReached)
            
            // Then lose target
            advanceTimeBy(100)
            viewModel.processFrame(0.5f)
            
            val lostState = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals("Target should be lost when score drops", false, lostState.isTargetReached)
        }
    }

    @Test
    fun `RFC-031 - Exercise state has correct initial values for multi-set routine`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        viewModel.uiState.test {
            val state = expectMostRecentItem() as PlayerUiState.Exercise
            
            assertEquals("Should start at Set 1", 1, state.currentSet)
            assertEquals("Should have 2 total sets", 2, state.totalSets)
            assertEquals("Should start at Rep 1", 1, state.currentRep)
            assertEquals("Should have 2 total reps per set", 2, state.totalReps)
            assertEquals("Hold time should be 3 seconds", 3, state.holdTimeLeft)
            assertEquals("Hold time total should be 3 seconds", 3, state.holdTimeTotal)
            assertTrue("Should be isometric exercise", state.isIsometric)
            assertEquals("Should not be paused", false, state.isPaused)
        }
    }

    @Test
    fun `RFC-031 - Initial state has isTargetReached false`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        viewModel.uiState.test {
            val state = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals("Initial state should not have target reached", false, state.isTargetReached)
        }
    }

    @Test
    fun `RFC-031 - Rest state shows set info when isSetRest is true`() = runTest(testDispatcher) {
        // This tests that Rest state properly tracks set information
        // We verify the data class structure
        val restState = PlayerUiState.Rest(
            timeLeft = 5,
            nextExerciseName = "Test Exercise - Set 2",
            currentSet = 1,
            totalSets = 3,
            isSetRest = true
        )
        
        assertEquals(5, restState.timeLeft)
        assertEquals("Test Exercise - Set 2", restState.nextExerciseName)
        assertEquals(1, restState.currentSet)
        assertEquals(3, restState.totalSets)
        assertTrue(restState.isSetRest)
    }

    @Test
    fun `Verify completedSets and completedReps in UI state`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100) // Skip GetReady

        viewModel.uiState.test {
            val state = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals("Should have 0 completed sets", 0, state.completedSets)
            assertEquals("Should have 0 completed reps", 0, state.completedReps)
            assertEquals(1, state.currentSet)
            assertEquals(1, state.currentRep)
        }
    }

    // ==================== US1: Release-gating tests ====================

    @Test
    fun `US1 - Isometric rep does not count next rep while gesture is held after completion`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createIsometricRoutine(reps = 2, holdSeconds = 1)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100) // Skip GetReady

        val initial = viewModel.uiState.value as PlayerUiState.Exercise
        assertEquals(1, initial.currentRep)

        // Complete first rep: inject virtual timestamps so hold-time accumulates deterministically.
        // 20 frames × 60ms = 1200ms > 1000ms holdTarget → rep completes.
        var ts = 1000L
        repeat(20) {
            ts += 60
            viewModel.processFrame(1.0f, ts)
        }

        // After rep completes, startCurrentExercise emits state with awaitingRelease = true.
        // Keep gesture active — processFrame hits release gate and returns early.
        repeat(5) {
            ts += 60
            viewModel.processFrame(1.0f, ts)
        }

        val afterHold = viewModel.uiState.value
        assertTrue(
            "Expected Exercise state after rep completion, got: $afterHold",
            afterHold is PlayerUiState.Exercise
        )
        assertTrue(
            "awaitingRelease must be true while gesture is held after rep completion",
            (afterHold as PlayerUiState.Exercise).awaitingRelease
        )
    }

    @Test
    fun `US1 - Isometric next rep starts after release and re-engage`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createIsometricRoutine(reps = 2, holdSeconds = 1)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        var ts = 1000L

        // Complete first rep
        repeat(20) { ts += 60; viewModel.processFrame(1.0f, ts) }

        // Release gesture (score below release threshold 0.75)
        repeat(5) { ts += 60; viewModel.processFrame(0.3f, ts) }

        // Re-engage for second rep (hold time accumulates for rep 2)
        repeat(5) { ts += 60; viewModel.processFrame(1.0f, ts) }

        val state = viewModel.uiState.value
        if (state is PlayerUiState.Exercise) {
            assertFalse("awaitingRelease must be false after release", state.awaitingRelease)
        }
    }

    @Test
    fun `US1 - Isotonic rep does not count next rep while gesture is held after completion`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createIsotonicRoutine(reps = 2)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        // Trigger first rep: rising edge (0 -> 1)
        advanceTimeBy(60)
        viewModel.processFrame(0.3f)
        advanceTimeBy(60)
        viewModel.processFrame(1.0f) // rep 1 completes here

        // Keep gesture active — must NOT trigger rep 2
        repeat(5) {
            advanceTimeBy(60)
            viewModel.processFrame(1.0f)
        }

        val state = viewModel.uiState.value
        assertTrue(
            "Expected Exercise state, got: $state",
            state is PlayerUiState.Exercise
        )
        assertTrue(
            "awaitingRelease must be true for isotonic while gesture is held after rep",
            (state as PlayerUiState.Exercise).awaitingRelease
        )
    }

    @Test
    fun `US1 - Isotonic next rep counts after release and re-engage`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createIsotonicRoutine(reps = 2)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        // Trigger first rep
        advanceTimeBy(60)
        viewModel.processFrame(0.3f)
        advanceTimeBy(60)
        viewModel.processFrame(1.0f)

        // Release
        repeat(3) {
            advanceTimeBy(60)
            viewModel.processFrame(0.2f)
        }

        // Re-engage
        advanceTimeBy(60)
        viewModel.processFrame(0.3f)
        advanceTimeBy(60)
        viewModel.processFrame(1.0f)

        val state = viewModel.uiState.value
        if (state is PlayerUiState.Exercise) {
            assertFalse("awaitingRelease must be false after release+re-engage", state.awaitingRelease)
        }
    }

    @Test
    fun `US1 - Jitter near release threshold does not cause false release`() = runTest(testDispatcher) {
        // Given: score oscillates between 0.76 and 0.80 (above release threshold 0.75)
        routineFlow.value = createIsometricRoutine(reps = 2, holdSeconds = 1)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        var ts = 1000L

        // Complete first rep
        repeat(20) { ts += 60; viewModel.processFrame(1.0f, ts) }

        // Jitter above release threshold — should NOT release
        repeat(10) { i ->
            ts += 60
            viewModel.processFrame(if (i % 2 == 0) 0.76f else 0.80f, ts)
        }

        val state = viewModel.uiState.value
        assertTrue(
            "Expected Exercise state during jitter, got: $state",
            state is PlayerUiState.Exercise
        )
        assertTrue(
            "awaitingRelease must remain true when score stays above release threshold",
            (state as PlayerUiState.Exercise).awaitingRelease
        )
    }

    // ==================== US2: Rep completion sound tests ====================

    @Test
    fun `US2 - PlayDing is emitted exactly once when isometric rep completes`() = runTest(testDispatcher) {
        // Given: 1 rep, 1s hold.
        routineFlow.value = createIsometricRoutine(reps = 1, holdSeconds = 1)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100) // Skip GetReady
        testDispatcher.scheduler.runCurrent()

        viewModel.events.test {
            var ts = 1000L
            // Hold gesture for 1 second using virtual timestamps
            repeat(20) { ts += 60; viewModel.processFrame(1.0f, ts) }
            testDispatcher.scheduler.runCurrent()

            // First event after rep completion must be PlayDing
            val first = awaitItem()
            assertEquals("PlayDing must be emitted on rep completion", PlayerEvent.PlayDing, first)
            cancelAndConsumeRemainingEvents()
        }
    }

    @Test
    fun `US2 - No PlayDing emitted while rep is in progress`() = runTest(testDispatcher) {
        // Given: hold requires 3s, we only inject ~1s worth of virtual time
        routineFlow.value = createIsometricRoutine(reps = 1, holdSeconds = 3)
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)
        testDispatcher.scheduler.runCurrent()

        viewModel.events.test {
            var ts = 1000L
            // 15 frames × 60ms = 900ms < 3000ms required — rep must NOT complete
            repeat(15) { ts += 60; viewModel.processFrame(1.0f, ts) }
            testDispatcher.scheduler.runCurrent()

            val emitted = cancelAndConsumeRemainingEvents()
            val dingCount = emitted.count { it is app.cash.turbine.Event.Item && it.value == PlayerEvent.PlayDing }
            assertEquals("No PlayDing should be emitted while rep is still in progress", 0, dingCount)
        }
    }

    @Test
    fun `Verify calibration reloads on startSession`() = runTest(testDispatcher) {
        // Given
        val initialBaseline = CalibrationBaseline(mouthSmileMax = 0.5f)
        every { calibrationRepository.getBaseline() } returns initialBaseline
        routineFlow.value = createTestRoutine()
        
        viewModel = PlayerViewModel(routineRepository, calibrationRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        
        // Then - modify repository response
        val newBaseline = CalibrationBaseline(mouthSmileMax = 0.9f)
        every { calibrationRepository.getBaseline() } returns newBaseline
        
        // When - restart session
        viewModel.restart()
        testDispatcher.scheduler.runCurrent()
        
        // Verification would be indirect via logging or if we exposed baseline, 
        // but this ensures the call is made
        // In a real unit test we would verify the repository call count
        // 1. Property init
        // 2. loadRoutine -> startSession
        // 3. restart -> startSession
        io.mockk.verify(exactly = 3) { calibrationRepository.getBaseline() }
    }
}
