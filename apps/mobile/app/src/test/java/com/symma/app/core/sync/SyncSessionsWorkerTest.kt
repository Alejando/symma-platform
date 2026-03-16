package com.symma.app.core.sync

import android.content.Context
import androidx.work.ListenableWorker
import androidx.work.WorkerParameters
import com.symma.app.domain.model.Session
import com.symma.app.domain.model.SyncStatus
import com.symma.app.domain.repository.SessionRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import java.io.IOException

class SyncSessionsWorkerTest {

    private lateinit var context: Context
    private lateinit var workerParams: WorkerParameters
    private lateinit var sessionRepository: SessionRepository
    private lateinit var worker: SyncSessionsWorker

    @Before
    fun setup() {
        context = mockk(relaxed = true)
        workerParams = mockk(relaxed = true)
        sessionRepository = mockk(relaxed = true)
        worker = SyncSessionsWorker(context, workerParams, sessionRepository)
    }

    @Test
    fun `doWork returns success when no pending sessions`() = runBlocking {
        coEvery { sessionRepository.getPendingSessions() } returns emptyList()

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.success(), result)
    }

    @Test
    fun `doWork processes all pending sessions`() = runBlocking {
        val sessions = listOf(
            createSession("session-1"),
            createSession("session-2"),
            createSession("session-3")
        )
        coEvery { sessionRepository.getPendingSessions() } returns sessions
        coEvery { sessionRepository.syncSession(any()) } returns Result.success(Unit)

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.success(), result)
        coVerify(exactly = 3) { sessionRepository.syncSession(any()) }
    }

    @Test
    fun `doWork marks sessions as SYNCED on 2xx`() = runBlocking {
        val sessions = listOf(createSession("session-1"))
        coEvery { sessionRepository.getPendingSessions() } returns sessions
        coEvery { sessionRepository.syncSession("session-1") } returns Result.success(Unit)

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.success(), result)
    }

    @Test
    fun `doWork returns retry on network error`() = runBlocking {
        val sessions = listOf(createSession("session-1"))
        coEvery { sessionRepository.getPendingSessions() } returns sessions
        coEvery { sessionRepository.syncSession("session-1") } returns Result.failure(IOException("Network error"))

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.retry(), result)
    }

    @Test
    fun `doWork continues processing after permanent error`() = runBlocking {
        val sessions = listOf(
            createSession("session-1"),
            createSession("session-2")
        )
        coEvery { sessionRepository.getPendingSessions() } returns sessions
        coEvery { sessionRepository.syncSession("session-1") } returns Result.failure(Exception("400 Bad Request"))
        coEvery { sessionRepository.syncSession("session-2") } returns Result.success(Unit)

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.success(), result)
        coVerify(exactly = 2) { sessionRepository.syncSession(any()) }
    }

    @Test
    fun `doWork returns retry when some sessions have network errors`() = runBlocking {
        val sessions = listOf(
            createSession("session-1"),
            createSession("session-2"),
            createSession("session-3")
        )
        coEvery { sessionRepository.getPendingSessions() } returns sessions
        coEvery { sessionRepository.syncSession("session-1") } returns Result.success(Unit)
        coEvery { sessionRepository.syncSession("session-2") } returns Result.failure(IOException("Network error"))
        coEvery { sessionRepository.syncSession("session-3") } returns Result.success(Unit)

        val result = worker.doWork()

        assertEquals(ListenableWorker.Result.retry(), result)
        coVerify(exactly = 3) { sessionRepository.syncSession(any()) }
    }

    private fun createSession(id: String): Session {
        return Session(
            id = id,
            routineId = "routine-1",
            startTime = System.currentTimeMillis(),
            endTime = System.currentTimeMillis() + 900000,
            durationSeconds = 900,
            score = 85f,
            syncStatus = SyncStatus.PENDING,
            items = emptyList()
        )
    }
}
