package com.symma.app.presentation.player

import androidx.lifecycle.SavedStateHandle
import app.cash.turbine.test
import com.symma.app.MainDispatcherRule
import com.symma.app.domain.model.Exercise
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
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
    private lateinit var routineFlow: MutableStateFlow<Routine?>
    private lateinit var savedStateHandle: SavedStateHandle
    private lateinit var viewModel: PlayerViewModel

    @Before
    fun setup() {
        routineFlow = MutableStateFlow(null)
        routineRepository = mockk()
        every { routineRepository.getRoutineFlow() } returns routineFlow
        savedStateHandle = SavedStateHandle()
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
                    exercise = Exercise("ex-1", "Exercise 1", "ex1", "Desc", "type", "cat", null, null)
                ),
                RoutineItem(
                    id = "item-2",
                    orderIndex = 1,
                    targetRepetitions = 1, // Only 1 rep for second exercise
                    targetSets = 1,
                    holdTimeSeconds = 2,
                    restBetweenSetsSeconds = 0,
                    exercise = Exercise("ex-2", "Exercise 2", "ex2", "Desc", "type", "cat", null, null)
                )
            )
        )
    }

    @Test
    fun `Verify Initial State starts in GetReady`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()

        // When
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)

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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
                    exercise = Exercise("ex-1", "Eyes Close", "eyes", "Close eyes tightly", "isometric", "eyes", null, null)
                )
            )
        )
    }

    @Test
    fun `RFC-031 - Exercise state includes Set tracking`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
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
    fun `RFC-031 - Exercise state correctly reports isIsometric based on holdTime`() = runTest(testDispatcher) {
        // Given: Routine with holdTimeSeconds > 0
        routineFlow.value = createMultiSetRoutine()
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        advanceTimeBy(5100)

        viewModel.uiState.test {
            val state = expectMostRecentItem() as PlayerUiState.Exercise
            assertTrue("Exercise with holdTime > 0 should be isometric", state.isIsometric)
        }
    }
}
