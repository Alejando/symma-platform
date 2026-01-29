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
    fun `Verify Rep Logic - timer reaches 0, increments rep, enters Rest`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent() // Loading -> GetReady
        advanceTimeBy(5500) // Skip GetReady (5s)

        viewModel.uiState.test {
            // Should be in Exercise 1, Rep 1, Time 3
            val startState = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals(1, startState.currentRep)
            assertEquals(3, startState.timeLeft)

            // 1. Simulate Timer reaching 0 (Advance 3 seconds)
            advanceTimeBy(3000)
            
            // 2. Since this item has 2 reps and rest time 5s, it should go to Rest
            advanceTimeBy(100) // Transition buffer
            
            val restState = expectMostRecentItem()
            assertTrue("Expected Rest state between reps", restState is PlayerUiState.Rest)
            assertEquals(5, (restState as PlayerUiState.Rest).timeLeft) 
            assertEquals("Exercise 1", restState.nextExerciseName) // Still same exercise

            // 3. Simulate Rest finish (Advance 5s)
            advanceTimeBy(5000)
            advanceTimeBy(100)

            // 4. Should be Exercise 1, Rep 2
            val nextRepState = expectMostRecentItem() as PlayerUiState.Exercise
            assertEquals(2, nextRepState.currentRep)
            assertEquals("Exercise 1", nextRepState.exerciseName)
        }
    }

    @Test
    fun `Verify Completion - all exercises finished leads to Completed state`() = runTest(testDispatcher) {
        // Given
        routineFlow.value = createTestRoutine()
        viewModel = PlayerViewModel(routineRepository, savedStateHandle)
        testDispatcher.scheduler.runCurrent()
        
        viewModel.uiState.test {
            // GetReady -> Exercise 1 (Rep 1)
            advanceTimeBy(5100); assert(expectMostRecentItem() is PlayerUiState.Exercise)
            
            // Ex 1 Rep 1 (3s) -> Rest (5s) -> Ex 1 Rep 2 (3s)
            advanceTimeBy(3000 + 5000 + 3000)
            advanceTimeBy(100) // buffer
            
            // Now checks next exercise: Ex 2 (1 Rep, 2s hold)
            // It might have a transition rest or immediate start. 
            // Logic says: if there is a rest between sets for previous item, it uses that? 
            // Or typically there is a rest between different exercises too.
            // Let's just fast forward enough to cover Exercise 2.
            
            // Ex 2 Rep 1 (2s)
            // There might be a default rest between exercises (default 10s in VM)
            // Let's be generous with time advancement to reach end
            advanceTimeBy(20000) 

            val finalState = expectMostRecentItem()
            assertTrue("Expected Completed state, got $finalState", finalState is PlayerUiState.Completed)
            val completed = finalState as PlayerUiState.Completed
            assertEquals(2, completed.totalExercises)
        }
    }
}
