package com.symma.app.data.repository

import app.cash.turbine.test
import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.RoutineDao
import com.symma.app.data.local.entity.ExerciseEntity
import com.symma.app.data.local.entity.RoutineEntity
import com.symma.app.data.local.entity.RoutineItemEntity
import com.symma.app.data.local.entity.RoutineItemWithExercise
import com.symma.app.data.local.entity.RoutineWithItemsAndExercises
import com.symma.app.data.remote.dto.exercise.ExerciseDto
import com.symma.app.data.remote.dto.routine.RoutineDto
import com.symma.app.data.remote.dto.routine.RoutineItemDto
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.IOException

class RoutineRepositoryImplTest {

    private lateinit var apiService: SymmaApiService
    private lateinit var routineDao: RoutineDao
    private lateinit var repository: RoutineRepositoryImpl

    @Before
    fun setup() {
        apiService = mockk()
        routineDao = mockk(relaxed = true)
        repository = RoutineRepositoryImpl(apiService, routineDao)
    }

    @Test
    fun `refreshRoutine success inserts data to database`() = runTest {
        // Given
        val exerciseDto = ExerciseDto(
            id = "ex-1",
            name = "Smile",
            keyName = "smile",
            description = "Practice smiling",
            type = "facial",
            category = "mouth",
            assetAnimationUrl = null,
            assetTutorialVideoUrl = null
        )
        val routineItemDto = RoutineItemDto(
            id = "item-1",
            orderIndex = 0,
            targetRepetitions = 10,
            targetSets = 3,
            holdTimeSeconds = 5,
            restBetweenSetsSeconds = 30,
            exercise = exerciseDto
        )
        val routineDto = RoutineDto(
            id = "routine-1",
            name = "Daily Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active",
            items = listOf(routineItemDto)
        )

        coEvery { apiService.getActiveRoutine() } returns retrofit2.Response.success(routineDto)

        // When
        val result = repository.refreshRoutine()

        // Then
        assertTrue(result.isSuccess)
        coVerify {
            routineDao.replaceRoutineWithItems(
                routine = any(),
                exercises = any(),
                items = any()
            )
        }
    }

    @Test
    fun `refreshRoutine network error does not crash`() = runTest {
        // Given
        coEvery { apiService.getActiveRoutine() } throws IOException("Network error")

        // When
        val result = repository.refreshRoutine()

        // Then
        assertTrue(result.isFailure)
        coVerify(exactly = 0) { routineDao.replaceRoutineWithItems(any(), any(), any()) }
    }

    @Test
    fun `getRoutineFlow emits routine from database`() = runTest {
        // Given
        val routineEntity = RoutineEntity(
            id = "routine-1",
            name = "Daily Routine",
            startDate = "2024-01-01",
            endDate = null,
            status = "active"
        )
        val exerciseEntity = ExerciseEntity(
            id = "ex-1",
            name = "Smile",
            keyName = "smile",
            description = "Practice smiling",
            type = "facial",
            category = "mouth",
            assetAnimationUrl = null,
            assetTutorialVideoUrl = null
        )
        val routineItemEntity = RoutineItemEntity(
            id = "item-1",
            routineId = "routine-1",
            exerciseId = "ex-1",
            orderIndex = 0,
            targetRepetitions = 10,
            targetSets = 3,
            holdTimeSeconds = 5,
            restBetweenSetsSeconds = 30
        )
        val routineWithItems = RoutineWithItemsAndExercises(
            routine = routineEntity,
            itemsWithExercises = listOf(
                RoutineItemWithExercise(
                    routineItem = routineItemEntity,
                    exercise = exerciseEntity
                )
            )
        )

        every { routineDao.getActiveRoutine() } returns flowOf(routineWithItems)

        // When & Then
        repository.getRoutineFlow().test {
            val routine = awaitItem()
            assertEquals("Daily Routine", routine?.name)
            assertEquals(1, routine?.items?.size)
            assertEquals("Smile", routine?.items?.first()?.exercise?.name)
            cancelAndConsumeRemainingEvents()
        }
    }

    @Test
    fun `getRoutineFlow emits null when database is empty`() = runTest {
        // Given
        every { routineDao.getActiveRoutine() } returns flowOf(null)

        // When & Then
        repository.getRoutineFlow().test {
            assertNull(awaitItem())
            cancelAndConsumeRemainingEvents()
        }
    }
}
