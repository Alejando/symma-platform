package com.symma.app.domain.usecase

import androidx.work.WorkManager
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.repository.SessionRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class SaveAndSyncSessionUseCaseTest {

    private lateinit var sessionRepository: SessionRepository
    private lateinit var workManager: WorkManager
    private lateinit var useCase: SaveAndSyncSessionUseCase

    @Before
    fun setup() {
        sessionRepository = mockk(relaxed = true)
        workManager = mockk(relaxed = true)
        useCase = SaveAndSyncSessionUseCase(sessionRepository, workManager)
    }

    @Test
    fun `invoke saves session before attempting sync`() = runBlocking {
        val sessionId = "session-123"
        coEvery { sessionRepository.saveSession(any(), any(), any(), any(), any(), any()) } returns Result.success(sessionId)
        coEvery { sessionRepository.syncSession(sessionId) } returns Result.success(Unit)

        val result = useCase(
            routineId = "routine-1",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = emptyList()
        )

        assertTrue(result.isSuccess)
        assertEquals(sessionId, result.getOrNull())
        coVerify(ordering = io.mockk.Ordering.ORDERED) {
            sessionRepository.saveSession(any(), any(), any(), any(), any(), any())
        }
    }

    @Test
    fun `invoke returns local session id immediately after save`() = runBlocking {
        val sessionId = "session-456"
        coEvery { sessionRepository.saveSession(any(), any(), any(), any(), any(), any()) } returns Result.success(sessionId)

        val result = useCase(
            routineId = "routine-1",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = listOf(
                SessionItemRequest(
                    exerciseId = "exercise-1",
                    repsCompleted = 10,
                    difficulty = 1,
                    averageAccuracy = 85f
                )
            )
        )

        assertTrue(result.isSuccess)
        assertEquals(sessionId, result.getOrNull())
    }

    @Test
    fun `invoke enqueues WorkManager with CONNECTED constraint`() = runBlocking {
        coEvery { sessionRepository.saveSession(any(), any(), any(), any(), any(), any()) } returns Result.success("session-123")

        useCase(
            routineId = "routine-1",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = emptyList()
        )

        verify { workManager.enqueueUniqueWork(any(), any(), any<androidx.work.OneTimeWorkRequest>()) }
    }

    @Test
    fun `invoke returns failure when save fails`() = runBlocking {
        coEvery { sessionRepository.saveSession(any(), any(), any(), any(), any(), any()) } returns Result.failure(Exception("Save failed"))

        val result = useCase(
            routineId = "routine-1",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = emptyList()
        )

        assertTrue(result.isFailure)
    }
}
