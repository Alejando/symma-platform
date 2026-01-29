package com.symma.app.presentation.home

import app.cash.turbine.test
import com.symma.app.domain.model.Exercise
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem
import com.symma.app.domain.repository.RoutineRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var routineRepository: RoutineRepository
    private lateinit var routineFlow: MutableStateFlow<Routine?>

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        routineFlow = MutableStateFlow(null)
        routineRepository = mockk()
        every { routineRepository.getRoutineFlow() } returns routineFlow
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createTestRoutine(): Routine {
        return Routine(
            id = "routine-1",
            name = "Daily Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(
                RoutineItem(
                    id = "item-1",
                    orderIndex = 0,
                    targetRepetitions = 10,
                    targetSets = 3,
                    holdTimeSeconds = 5,
                    restBetweenSetsSeconds = 30,
                    exercise = Exercise(
                        id = "ex-1",
                        name = "Smile",
                        keyName = "smile",
                        description = "Practice smiling",
                        type = "facial",
                        category = "mouth",
                        assetAnimationUrl = null,
                        assetTutorialVideoUrl = null
                    )
                )
            )
        )
    }

    @Test
    fun `init triggers refresh`() = runTest {
        // Given
        coEvery { routineRepository.refreshRoutine() } returns Result.success(Unit)

        // When
        HomeViewModel(routineRepository)

        // Then
        coVerify { routineRepository.refreshRoutine() }
    }

    @Test
    fun `uiState with routine emits content state`() = runTest {
        // Given
        coEvery { routineRepository.refreshRoutine() } returns Result.success(Unit)
        routineFlow.value = createTestRoutine()

        // When
        val viewModel = HomeViewModel(routineRepository)

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertTrue("Expected Content but got $state", state is HomeUiState.Content)
            assertEquals("Daily Routine", (state as HomeUiState.Content).routine.name)
            cancelAndConsumeRemainingEvents()
        }
    }

    @Test
    fun `uiState with empty database emits empty state`() = runTest {
        // Given
        coEvery { routineRepository.refreshRoutine() } returns Result.success(Unit)
        routineFlow.value = null

        // When
        val viewModel = HomeViewModel(routineRepository)

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(HomeUiState.Empty, state)
            cancelAndConsumeRemainingEvents()
        }
    }

    @Test
    fun `refreshRoutine failure with empty db emits error state`() = runTest {
        // Given
        coEvery { routineRepository.refreshRoutine() } returns Result.failure(Exception("Network error"))
        routineFlow.value = null

        // When
        val viewModel = HomeViewModel(routineRepository)

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertTrue("Expected Error but got $state", state is HomeUiState.Error)
            assertEquals("Network error", (state as HomeUiState.Error).message)
            cancelAndConsumeRemainingEvents()
        }
    }
}

